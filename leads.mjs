// Cadastros do formulário V12 guardados no armazenamento do próprio Netlify (Netlify Blobs). Sem token.
import { getStore } from "@netlify/blobs";

const PIN = process.env.PANEL_PIN || "1406";
const J = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  const store = getStore("leads");

  // Qualquer visitante envia o cadastro
  if (req.method === "POST") {
    let d;
    try { d = await req.json(); } catch { return J({ erro: "json" }, 400); }
    const nome = String(d.nome || "").trim().slice(0, 80);
    const tel = String(d.tel || "").trim().slice(0, 30);
    if (nome.length < 2 || tel.replace(/\D/g, "").length < 10) return J({ erro: "dados" }, 400);
    const resp = Array.isArray(d.resp) ? d.resp.slice(0, 10).map((x) => String(x).slice(0, 120)) : [];
    const ts = Date.now();
    const id = ts + "-" + Math.random().toString(36).slice(2, 8);
    await store.setJSON(id, { id, nome, tel, resp, ts });
    return J({ ok: true, id });
  }

  // Painel: só com a senha
  if ((req.headers.get("x-pin") || "") !== PIN) return J({ erro: "senha" }, 401);

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return J({ erro: "id" }, 400);
    await store.delete(id);
    return J({ ok: true });
  }

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return J(all.filter(Boolean).sort((a, b) => b.ts - a.ts));
  }

  return J({ erro: "metodo" }, 405);
};
