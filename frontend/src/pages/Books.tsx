import { useState, useEffect, useCallback } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Table, Th, Td, Modal, Empty } from "../components/ui";
import { booksApi } from "../lib/api";

interface Book { _id: string; title: string; author: string; isbn: string; genre: string; publishedYear: number; totalCopies: number; availableCopies: number; coverColor?: string; }

const genreOptions = [
  { value: "", label: "All Genres" },
  { value: "Fiction", label: "Fiction" },
  { value: "Fantasy", label: "Fantasy" },
  { value: "Dystopian", label: "Dystopian" },
  { value: "Historical", label: "Historical" },
  { value: "Romance", label: "Romance" },
  { value: "Adventure", label: "Adventure" },
];

function BookCover({ book }: { book: Book }) {
  return (
    <div className="w-9 h-12 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: book.coverColor || "#6366f1" }}>
      <BookOpen className="w-4 h-4 text-white/80" />
    </div>
  );
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", genre: "Fiction", publishedYear: "2020", totalCopies: "3" });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await booksApi.getAll({ search, genre });
      setBooks(data as Book[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, genre]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAdd = async () => {
    if (!newBook.title || !newBook.author) return;
    setSaving(true); setError("");
    const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#ef4444","#8b5cf6","#14b8a6","#0ea5e9"];
    try {
      await booksApi.create({ ...newBook, publishedYear: parseInt(newBook.publishedYear), totalCopies: parseInt(newBook.totalCopies), coverColor: colors[Math.floor(Math.random() * colors.length)] });
      setAddOpen(false);
      setNewBook({ title: "", author: "", isbn: "", genre: "Fiction", publishedYear: "2020", totalCopies: "3" });
      fetchBooks();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to add book"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8">
      <PageHeader title="Books" subtitle={`${books.length} books in catalog`}
        action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Book</Button>} />

      <Card className="p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search by title or author..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <Select value={genre} onChange={setGenre} options={genreOptions} className="min-w-36" />
        </div>
      </Card>

      <Card>
        {loading ? <div className="py-16 text-center text-slate-400 text-sm">Loading books...</div> : (
          <Table>
            <thead><tr className="bg-slate-50/70">
              <Th>Book</Th><Th>ISBN</Th><Th>Genre</Th><Th>Year</Th><Th>Copies</Th><Th>Available</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {books.length === 0 ? <tr><td colSpan={7}><Empty message="No books found" /></td></tr> :
                books.map((book) => (
                  <tr key={book._id} className="hover:bg-slate-50/50 transition-colors">
                    <Td><div className="flex items-center gap-3"><BookCover book={book} /><div><p className="font-medium text-slate-800">{book.title}</p><p className="text-xs text-slate-400">{book.author}</p></div></div></Td>
                    <Td><span className="font-mono text-xs">{book.isbn}</span></Td>
                    <Td><Badge variant="neutral">{book.genre}</Badge></Td>
                    <Td>{book.publishedYear}</Td>
                    <Td>{book.totalCopies}</Td>
                    <Td>{book.availableCopies}</Td>
                    <Td><Badge variant={book.availableCopies === 0 ? "danger" : book.availableCopies <= 1 ? "warning" : "success"}>
                      {book.availableCopies === 0 ? "Out of Stock" : book.availableCopies <= 1 ? "Low Stock" : "Available"}
                    </Badge></Td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setError(""); }} title="Add New Book">
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Title *" placeholder="Book title" value={newBook.title} onChange={(v) => setNewBook({ ...newBook, title: v })} />
          <Input label="Author *" placeholder="Author name" value={newBook.author} onChange={(v) => setNewBook({ ...newBook, author: v })} />
          <Input label="ISBN" placeholder="978-..." value={newBook.isbn} onChange={(v) => setNewBook({ ...newBook, isbn: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Genre" value={newBook.genre} onChange={(v) => setNewBook({ ...newBook, genre: v })} options={genreOptions.slice(1)} />
            <Input label="Year" type="number" placeholder="Year" value={newBook.publishedYear} onChange={(v) => setNewBook({ ...newBook, publishedYear: v })} />
          </div>
          <Input label="Total Copies" type="number" value={newBook.totalCopies} onChange={(v) => setNewBook({ ...newBook, totalCopies: v })} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">{saving ? "Adding..." : "Add Book"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
