import { useEffect, useState } from "react";
import api, { fileUrl, mediaUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Film, ListVideo, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = ["Thailand", "Korea", "Japan", "China", "Philippines", "Taiwan", "Vietnam"];
const GENRES = ["Romance", "Drama", "Comedia", "Universitario", "Fantasía", "Histórico", "Musical"];
const STATUSES = [{ v: "ongoing", l: "En emisión" }, { v: "completed", l: "Finalizada" }];

const blank = {
  title: "", original_title: "", country: "Thailand", year: 2025, synopsis: "",
  genres: [], poster_path: "", backdrop_path: "", cast: [], status: "ongoing", featured: false,
};

const Admin = () => {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  const refreshSeries = async () => {
    const r = await api.get("/series");
    setSeries(r.data);
  };
  useEffect(() => { refreshSeries(); }, []);

  useEffect(() => {
    if (selectedSeries) {
      api.get(`/series/${selectedSeries.id}/episodes`).then((r) => setEpisodes(r.data));
    } else {
      setEpisodes([]);
    }
  }, [selectedSeries]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="pt-24 px-6 md:px-10 max-w-[1600px] mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#E07A8F] font-semibold mb-2">Panel de administración</p>
            <h1 className="font-heading text-3xl md:text-5xl font-black">Gestión de catálogo</h1>
          </div>
        </div>

        <Tabs defaultValue="series" data-testid="admin-tabs">
          <TabsList className="bg-neutral-950 border border-white/10">
            <TabsTrigger value="series" data-testid="tab-series" className="data-[state=active]:bg-[#E07A8F] data-[state=active]:text-black">
              <Film className="w-4 h-4 mr-2" /> Series
            </TabsTrigger>
            <TabsTrigger value="episodes" data-testid="tab-episodes" className="data-[state=active]:bg-[#E07A8F] data-[state=active]:text-black">
              <ListVideo className="w-4 h-4 mr-2" /> Episodios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="series" className="mt-6">
            <SeriesAdmin series={series} refresh={refreshSeries} />
          </TabsContent>

          <TabsContent value="episodes" className="mt-6">
            <div className="mb-4 max-w-md">
              <Label className="text-neutral-400 text-xs uppercase tracking-wider mb-2 block">Selecciona una serie</Label>
              <Select
                value={selectedSeries?.id || ""}
                onValueChange={(id) => setSelectedSeries(series.find((s) => s.id === id))}
              >
                <SelectTrigger data-testid="ep-select-series" className="bg-neutral-950 border-white/10">
                  <SelectValue placeholder="Elige una serie…" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950 border-white/10 text-white">
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSeries && (
              <EpisodesAdmin
                series={selectedSeries}
                episodes={episodes}
                refresh={async () => {
                  const r = await api.get(`/series/${selectedSeries.id}/episodes`);
                  setEpisodes(r.data);
                  refreshSeries();
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const SeriesAdmin = ({ series, refresh }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setOpen(true); };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar serie y todos sus episodios?")) return;
    await api.delete(`/series/${id}`);
    toast.success("Serie eliminada");
    refresh();
  };

  return (
    <div>
      <div className="mb-4">
        <Button data-testid="add-series-btn" onClick={openCreate} className="rounded-full bg-[#E07A8F] text-black hover:bg-[#F090A4]">
          <Plus className="w-4 h-4 mr-2" /> Nueva serie
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="text-left p-4">Título</th>
              <th className="text-left p-4">País</th>
              <th className="text-left p-4">Año</th>
              <th className="text-left p-4">Eps.</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Destacada</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {series.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-neutral-500">No hay series. Crea la primera.</td></tr>
            ) : series.map((s) => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02]" data-testid={`admin-series-${s.id}`}>
                <td className="p-4 font-semibold">{s.title}</td>
                <td className="p-4 text-neutral-400">{s.country}</td>
                <td className="p-4 text-neutral-400">{s.year}</td>
                <td className="p-4 text-neutral-400">{s.total_episodes}</td>
                <td className="p-4 text-neutral-400">{s.status === "completed" ? "Finalizada" : "En emisión"}</td>
                <td className="p-4">{s.featured ? <span className="text-[#E07A8F] text-xs">★ Sí</span> : <span className="text-neutral-600 text-xs">No</span>}</td>
                <td className="p-4 text-right">
                  <button data-testid={`edit-series-${s.id}`} onClick={() => openEdit(s)} className="p-2 hover:bg-white/10 rounded-md text-neutral-300">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button data-testid={`delete-series-${s.id}`} onClick={() => remove(s.id)} className="p-2 hover:bg-white/10 rounded-md text-red-400 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SeriesDialog open={open} setOpen={setOpen} editing={editing} onSaved={refresh} />
    </div>
  );
};

const SeriesDialog = ({ open, setOpen, editing, onSaved }) => {
  const [form, setForm] = useState(blank);
  const [castStr, setCastStr] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ ...blank, ...editing });
      setCastStr((editing.cast || []).join(", "));
    } else {
      setForm(blank);
      setCastStr("");
    }
  }, [editing, open]);

  const upload = async (file, field) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, [field]: data.path }));
      toast.success("Imagen subida");
    } catch (e) {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const payload = {
      ...form,
      year: parseInt(form.year) || 2025,
      cast: castStr.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await api.put(`/series/${editing.id}`, payload);
        toast.success("Serie actualizada");
      } else {
        await api.post("/series", payload);
        toast.success("Serie creada");
      }
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error("Error al guardar");
    }
  };

  const toggleGenre = (g) => {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{editing ? "Editar serie" : "Nueva serie"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-neutral-400">Título</Label>
            <Input data-testid="series-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-neutral-400">Título original</Label>
            <Input value={form.original_title} onChange={(e) => setForm({ ...form, original_title: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">País</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-950 border-white/10 text-white">
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">Año</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-950 border-white/10 text-white">
                  {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-neutral-400">Sinopsis</Label>
            <Textarea value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} className="bg-black/40 border-white/10 mt-1.5 min-h-[100px]" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-neutral-400">Géneros</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  data-testid={`genre-${g}`}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${form.genres.includes(g) ? "bg-[#E07A8F] text-black border-[#E07A8F]" : "border-white/10 text-neutral-400 hover:border-white/30"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-neutral-400">Elenco (separado por comas)</Label>
            <Input value={castStr} onChange={(e) => setCastStr(e.target.value)} className="bg-black/40 border-white/10 mt-1.5" placeholder="Mile Phakphum, Apo Nattawin" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageUpload
              label="Póster (2:3)"
              path={form.poster_path}
              uploading={uploading}
              onFile={(f) => upload(f, "poster_path")}
              onClear={() => setForm({ ...form, poster_path: "" })}
              testid="upload-poster"
            />
            <ImageUpload
              label="Backdrop (16:9)"
              path={form.backdrop_path}
              uploading={uploading}
              onFile={(f) => upload(f, "backdrop_path")}
              onClear={() => setForm({ ...form, backdrop_path: "" })}
              testid="upload-backdrop"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
            <input
              data-testid="featured-checkbox"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-[#E07A8F]"
            />
            Destacar en la portada
          </label>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-neutral-300 hover:bg-white/5">Cancelar</Button>
          <Button data-testid="save-series-btn" onClick={save} className="rounded-full bg-[#E07A8F] text-black hover:bg-[#F090A4]">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ImageUpload = ({ label, path, onFile, onClear, uploading, testid }) => {
  const url = mediaUrl(path);
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-neutral-400">{label}</Label>
      <div className="mt-1.5 aspect-[2/3] rounded-md bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <UploadIcon className="w-6 h-6 text-neutral-700" />
        )}
        {url && (
          <button onClick={onClear} className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 hover:bg-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <label className="mt-2 inline-flex items-center gap-2 text-xs cursor-pointer text-[#E07A8F] hover:text-[#F090A4]">
        <input data-testid={testid} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {uploading ? "Subiendo…" : "Subir imagen"}
      </label>
    </div>
  );
};

const EpisodesAdmin = ({ series, episodes, refresh }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const blankEp = { series_id: series.id, episode_number: (episodes.length || 0) + 1, title: "", video_url: "", thumbnail_path: "", duration: 0, description: "" };
  const [form, setForm] = useState(blankEp);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) setForm({ ...blankEp, ...editing });
    else setForm({ ...blankEp, episode_number: (episodes.length || 0) + 1 });
    // eslint-disable-next-line
  }, [editing, open, episodes.length]);

  const save = async () => {
    try {
      const payload = { ...form, episode_number: parseInt(form.episode_number) || 1, duration: parseInt(form.duration) || 0, series_id: series.id };
      if (editing) await api.put(`/episodes/${editing.id}`, payload);
      else await api.post("/episodes", payload);
      toast.success(editing ? "Episodio actualizado" : "Episodio creado");
      setOpen(false); setEditing(null);
      refresh();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar episodio?")) return;
    await api.delete(`/episodes/${id}`);
    toast.success("Episodio eliminado");
    refresh();
  };

  const upload = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, thumbnail_path: data.path }));
    } catch { toast.error("Error al subir"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold">{series.title} — Episodios</h3>
        <Button data-testid="add-episode-btn" onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full bg-[#E07A8F] text-black hover:bg-[#F090A4]">
          <Plus className="w-4 h-4 mr-2" /> Nuevo episodio
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Título</th>
              <th className="text-left p-4">URL</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {episodes.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-neutral-500">Aún no hay episodios.</td></tr>
            ) : episodes.map((ep) => (
              <tr key={ep.id} className="border-t border-white/5" data-testid={`admin-ep-${ep.episode_number}`}>
                <td className="p-4">{ep.episode_number}</td>
                <td className="p-4 font-semibold">{ep.title}</td>
                <td className="p-4 text-neutral-500 text-xs truncate max-w-md">{ep.video_url}</td>
                <td className="p-4 text-right">
                  <button onClick={() => { setEditing(ep); setOpen(true); }} className="p-2 hover:bg-white/10 rounded-md">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(ep.id)} className="p-2 hover:bg-white/10 rounded-md text-red-400 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-xl">
          <DialogHeader><DialogTitle className="font-heading text-2xl">{editing ? "Editar episodio" : "Nuevo episodio"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-2">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-neutral-400">Nº</Label>
                <Input data-testid="ep-number" type="number" value={form.episode_number} onChange={(e) => setForm({ ...form, episode_number: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-neutral-400">Título</Label>
                <Input data-testid="ep-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">URL del video (YouTube, Vimeo, mp4)</Label>
              <Input data-testid="ep-url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" placeholder="https://youtube.com/watch?v=…" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-black/40 border-white/10 mt-1.5 min-h-[80px]" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-neutral-400">Miniatura</Label>
              <label className="mt-2 inline-flex items-center gap-2 text-xs cursor-pointer text-[#E07A8F]">
                <input data-testid="upload-thumbnail" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                {uploading ? "Subiendo…" : (form.thumbnail_path ? "Reemplazar imagen" : "Subir miniatura")}
              </label>
              {form.thumbnail_path && (
                <img src={mediaUrl(form.thumbnail_path)} alt="" className="mt-2 max-w-xs rounded-md" />
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-neutral-300">Cancelar</Button>
            <Button data-testid="save-episode-btn" onClick={save} className="rounded-full bg-[#E07A8F] text-black hover:bg-[#F090A4]">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
