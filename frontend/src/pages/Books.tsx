import { useState, useEffect, useCallback } from "react";
import { Plus, BookOpen, PackageX, Package, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader, Card, Badge, Button, Input, Select,
  Table, Th, Td, TableFooter, Modal, Empty, SkeletonRows, Alert, SearchBar,
} from "../components/ui";
import { booksApi } from "../lib/api";
import type { Book, BookUpdate } from "../types";
import { useDebounce } from "../lib/utils";
import { useToast } from "../components/Toast";

const genreOptions = [
  { value: "",            label: "All Genres" },
  { value: "Fiction",     label: "Fiction" },
  { value: "Fantasy",     label: "Fantasy" },
  { value: "Dystopian",   label: "Dystopian" },
  { value: "Historical",  label: "Historical" },
  { value: "Romance",     label: "Romance" },
  { value: "Adventure",   label: "Adventure" },
  { value: "Science Fiction", label: "Sci-Fi" },
  { value: "Mystery",     label: "Mystery" },
  { value: "Biography",   label: "Biography" },
  { value: "Self-Help",   label: "Self-Help" },
];

const COVER_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ec4899",
  "#ef4444","#8b5cf6","#14b8a6","#0ea5e9","#f97316","#84cc16",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Add / Edit form state type ───────────────────────────────────────────────
interface BookForm {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: string;
  totalCopies: string;
}

const emptyForm: BookForm = {
  title: "", author: "", isbn: "", genre: "Fiction", publishedYear: "2020", totalCopies: "3",
};

function bookToForm(book: Book): BookForm {
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn || "",
    genre: book.genre,
    publishedYear: String(book.publishedYear),
    totalCopies: String(book.totalCopies),
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Books() {
  const { toast } = useToast();
  const [books, setBooks]           = useState<Book[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [genre, setGenre]           = useState("");

  // Add modal
  const [addOpen, setAddOpen]       = useState(false);
  const [addForm, setAddForm]       = useState<BookForm>(emptyForm);
  const [addError, setAddError]     = useState("");
  const [saving, setSaving]         = useState(false);

  // Edit modal
  const [editBook, setEditBook]     = useState<Book | null>(null);
  const [editForm, setEditForm]     = useState<BookForm>(emptyForm);
  const [editError, setEditError]   = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await booksApi.getAll({ search: debouncedSearch, genre });
      setBooks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, genre]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.author.trim()) {
      setAddError("Title and author are required.");
      return;
    }
    setSaving(true); setAddError("");
    try {
      await booksApi.create({
        title: addForm.title.trim(),
        author: addForm.author.trim(),
        isbn: addForm.isbn.trim(),
        genre: addForm.genre,
        publishedYear: parseInt(addForm.publishedYear) || 2020,
        totalCopies: parseInt(addForm.totalCopies) || 1,
        coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      });
      setAddOpen(false);
      setAddForm(emptyForm);
      fetchBooks();
      toast(`"${addForm.title}" added to catalog`);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add book");
    } finally { setSaving(false); }
  };

  // ── Edit open ────────────────────────────────────────────────────────────
  const openEdit = (book: Book) => {
    setEditBook(book);
    setEditForm(bookToForm(book));
    setEditError("");
  };

  // ── Edit save ────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editBook) return;
    if (!editForm.title.trim() || !editForm.author.trim()) {
      setEditError("Title and author are required.");
      return;
    }
    setEditSaving(true); setEditError("");
    try {
      const update: BookUpdate = {
        title:       editForm.title.trim(),
        author:      editForm.author.trim(),
        isbn:        editForm.isbn.trim(),
        genre:       editForm.genre,
        publishedYear: parseInt(editForm.publishedYear) || editBook.publishedYear,
        totalCopies: parseInt(editForm.totalCopies) || editBook.totalCopies,
      };
      await booksApi.update(editBook._id, update);
      setEditBook(null);
      fetchBooks();
      toast(`"${editForm.title}" updated`);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to update book");
    } finally { setEditSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteBook) return;
    setDeleting(true);
    try {
      await booksApi.delete(deleteBook._id);
      setDeleteBook(null);
      fetchBooks();
      toast(`"${deleteBook.title}" removed from catalog`);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to delete book", "error");
      setDeleteBook(null);
    } finally { setDeleting(false); }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const available  = books.filter(b => b.availableCopies > 0).length;
  const outOfStock = books.filter(b => b.availableCopies === 0).length;

  // ── Shared form fields component ─────────────────────────────────────────
  function BookFormFields({
    form, setForm,
  }: { form: BookForm; setForm: (f: BookForm) => void }) {
    return (
      <div className="space-y-4">
        <Input
          label="Title *"
          placeholder="e.g. The Great Gatsby"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <Input
          label="Author *"
          placeholder="e.g. F. Scott Fitzgerald"
          value={form.author}
          onChange={(v) => setForm({ ...form, author: v })}
        />
        <Input
          label="ISBN"
          placeholder="978-..."
          value={form.isbn}
          onChange={(v) => setForm({ ...form, isbn: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Genre"
            value={form.genre}
            onChange={(v) => setForm({ ...form, genre: v })}
            options={genreOptions.slice(1)}
          />
          <Input
            label="Year"
            type="number"
            placeholder="Year"
            value={form.publishedYear}
            onChange={(v) => setForm({ ...form, publishedYear: v })}
          />
        </div>
        <Input
          label="Total Copies"
          type="number"
          value={form.totalCopies}
          onChange={(v) => setForm({ ...form, totalCopies: v })}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Books"
        subtitle={`${books.length} titles in the catalog`}
        action={
          <Button onClick={() => { setAddForm(emptyForm); setAddError(""); setAddOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {[
          { label: "Total Titles", value: books.length,  cls: "icon-bg-indigo text-indigo-600",   icon: BookOpen },
          { label: "Available",    value: available,     cls: "icon-bg-emerald text-emerald-600", icon: Package },
          { label: "Out of Stock", value: outOfStock,    cls: "icon-bg-red text-red-600",         icon: PackageX },
        ].map(({ label, value, cls, icon: Icon }) => (
          <Card key={label} className="p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3.5">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xl sm:text-3xl font-bold text-theme-primary leading-none tabular-nums">{value}</p>
              <p className="text-xs text-theme-muted font-semibold mt-1 leading-tight">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or author…" />
          <Select value={genre} onChange={setGenre} options={genreOptions} className="w-full sm:w-auto sm:min-w-36" />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Book</Th>
              <Th className="hidden sm:table-cell">ISBN</Th>
              <Th>Genre</Th>
              <Th className="hidden sm:table-cell">Year</Th>
              <Th className="hidden sm:table-cell">Total</Th>
              <Th>Available</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} cols={8} />
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty message="No books found" hint="Try adjusting your search or add a new book" icon={BookOpen} />
                </td>
              </tr>
            ) : books.map((book) => (
              <tr key={book._id} className="hover:bg-[var(--bg-card-hover)]/60 transition-colors group">
                <Td className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <BookCover book={book} />
                    <div>
                      <p className="font-bold text-theme-primary text-sm leading-tight">{book.title}</p>
                      <p className="text-xs text-theme-muted mt-0.5 font-medium">{book.author}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="font-mono text-xs text-theme-muted">{book.isbn || "—"}</span>
                </Td>
                <Td><Badge variant="neutral">{book.genre}</Badge></Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-theme-secondary font-medium">{book.publishedYear}</span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="font-semibold text-theme-secondary">{book.totalCopies}</span>
                </Td>
                <Td><span className="font-bold text-theme-primary">{book.availableCopies}</span></Td>
                <Td><StockBadge book={book} /></Td>
                <Td>
                  {/* Action buttons — visible on hover (desktop) / always on mobile */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(book)}
                      title="Edit book"
                      className="p-2 rounded-lg text-theme-tertiary hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteBook(book)}
                      title="Delete book"
                      className="p-2 rounded-lg text-theme-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && <TableFooter total={books.length} />}
      </Card>

      {/* ── Add book modal ────────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddError(""); }}
        title="Add New Book"
        subtitle="Add a new title to the library catalog"
      >
        <div className="space-y-4">
          {addError && <Alert variant="error">{addError}</Alert>}
          <BookFormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? "Adding…" : "Add Book"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit book modal ───────────────────────────────────────────────── */}
      <Modal
        open={!!editBook}
        onClose={() => { setEditBook(null); setEditError(""); }}
        title="Edit Book"
        subtitle={editBook ? `Editing "${editBook.title}"` : ""}
      >
        <div className="space-y-4">
          {editError && <Alert variant="error">{editError}</Alert>}
          <BookFormFields form={editForm} setForm={setEditForm} />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setEditBook(null)} className="flex-1">Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving} className="flex-1">
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      <Modal
        open={!!deleteBook}
        onClose={() => setDeleteBook(null)}
        title="Delete Book"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20">
            <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-theme-primary">
                Remove <span className="text-red-600 dark:text-red-400">"{deleteBook?.title}"</span>?
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                This will permanently delete the book from the catalog. Books currently on loan cannot be deleted.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteBook(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? "Deleting…" : "Delete Book"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
