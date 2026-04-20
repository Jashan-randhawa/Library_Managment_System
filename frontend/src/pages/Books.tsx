import { useState, useEffect, useCallback } from "react";
import { Plus, BookOpen, PackageX, Package } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert, SearchBar,
} from "../components/ui";
import { booksApi } from "../lib/api";
import { useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  coverColor?: string;
}

const genreOptions = [
  { value: "", label: "All Genres" },
  { value: "Fiction", label: "Fiction" },
  { value: "Fantasy", label: "Fantasy" },
  { value: "Dystopian", label: "Dystopian" },
  { value: "Historical", label: "Historical" },
  { value: "Romance", label: "Romance" },
  { value: "Adventure", label: "Adventure" },
];

const COVER_COLORS = ["#6366f1","#10b981","#f59e0b","#ec4899","#ef4444","#8b5cf6","#14b8a6","#0ea5e9","#f97316","#84cc16"];

function BookCover({ book }: { book: Book }) {
  return (
    <div
      className="w-9 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ backgroundColor: book.coverColor || "#6366f1" }}
    >
      <BookOpen className="w-3.5 h-3.5 text-white/80" />
    </div>
  );
}

function StockBadge({ book }: { book: Book }) {
  if (book.availableCopies === 0) return <Badge variant="danger" dot>Out of Stock</Badge>;
  if (book.availableCopies <= 1)  return <Badge variant="warning" dot>Low Stock</Badge>;
  return <Badge variant="success" dot>Available</Badge>;
}

export default function Books() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newBook, setNewBook] = useState({
    title: "", author: "", isbn: "", genre: "Fiction", publishedYear: "2020", totalCopies: "3",
  });

  const debouncedSearch = useDebounce(search);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await booksApi.getAll({ search: debouncedSearch, genre });
      setBooks(data as Book[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [debouncedSearch, genre]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAdd = async () => {
    if (!newBook.title || !newBook.author) { setError("Title and author are required."); return; }
    setSaving(true); setError("");
    try {
      await booksApi.create({
        ...newBook,
        publishedYear: parseInt(newBook.publishedYear),
        totalCopies: parseInt(newBook.totalCopies),
        coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      });
      setAddOpen(false);
      setNewBook({ title: "", author: "", isbn: "", genre: "Fiction", publishedYear: "2020", totalCopies: "3" });
      fetchBooks();
      toast(`"${newBook.title}" added to catalog`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add book");
    } finally { setSaving(false); }
  };

  const available = books.filter(b => b.availableCopies > 0).length;
  const outOfStock = books.filter(b => b.availableCopies === 0).length;

  return (
    <div className="p-6 sm:p-8">
      <PageHeader
        title="Books"
        subtitle={`${books.length} titles in the catalog`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Titles", value: books.length, cls: "bg-indigo-50 text-indigo-600", icon: BookOpen },
          { label: "Available", value: available, cls: "bg-emerald-50 text-emerald-600", icon: Package },
          { label: "Out of Stock", value: outOfStock, cls: "bg-red-50 text-red-600", icon: PackageX },
        ].map(({ label, value, cls, icon: Icon }) => (
          <Card key={label} className="p-4 flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title or author…"
          />
          <Select value={genre} onChange={setGenre} options={genreOptions} className="min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Book</Th>
              <Th>ISBN</Th>
              <Th>Genre</Th>
              <Th>Year</Th>
              <Th>Total</Th>
              <Th>Available</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={7} />
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Empty message="No books found" hint="Try adjusting your search or add a new book" icon={BookOpen} />
                </td>
              </tr>
            ) : books.map((book) => (
              <tr key={book._id} className="hover:bg-slate-50/60 transition-colors">
                <Td className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <BookCover book={book} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm leading-tight">{book.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="font-mono text-xs text-slate-500">{book.isbn || "—"}</span></Td>
                <Td><Badge variant="neutral">{book.genre}</Badge></Td>
                <Td><span className="text-slate-500">{book.publishedYear}</span></Td>
                <Td><span className="font-medium text-slate-700">{book.totalCopies}</span></Td>
                <Td><span className="font-medium text-slate-700">{book.availableCopies}</span></Td>
                <Td><StockBadge book={book} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={books.length} />}
      </Card>

      {/* Add book modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setError(""); }}
        title="Add New Book"
        subtitle="Add a new title to the library catalog"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input label="Title *" placeholder="e.g. The Great Gatsby" value={newBook.title} onChange={(v) => setNewBook({ ...newBook, title: v })} />
          <Input label="Author *" placeholder="e.g. F. Scott Fitzgerald" value={newBook.author} onChange={(v) => setNewBook({ ...newBook, author: v })} />
          <Input label="ISBN" placeholder="978-..." value={newBook.isbn} onChange={(v) => setNewBook({ ...newBook, isbn: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Genre"
              value={newBook.genre}
              onChange={(v) => setNewBook({ ...newBook, genre: v })}
              options={genreOptions.slice(1)}
            />
            <Input label="Year" type="number" placeholder="Year" value={newBook.publishedYear} onChange={(v) => setNewBook({ ...newBook, publishedYear: v })} />
          </div>
          <Input label="Total Copies" type="number" value={newBook.totalCopies} onChange={(v) => setNewBook({ ...newBook, totalCopies: v })} />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? "Adding…" : "Add Book"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
