// carimbo-foto.js — carimbo de data e hora em toda foto tirada no GCA (16/11/2026, item 14 da lista).
// Uma faixa no pé da foto com:
//   1) data e hora de Brasília pelo relógio do SERVIDOR (o do celular pode estar errado) · filial
//   2) o que é a foto (ex.: "Pedido de material · FULANO", "Remessa de laudo REM-12")
//   3) se a foto veio da galeria (arquivo antigo): "Foto da galeria · arquivo de dd/mm/aaaa hh:mm"
// Usado pelo portal (pedido, desligamento), pelo GCA (desligamento, remessa de laudo) e pela
// conferência da viatura. A ficha técnica (foto de catálogo) fica de fora.
(function () {
  let deslocamento = null;   // milissegundos: relógio do servidor − relógio do aparelho
  let sincronizando = null;

  // Lê a hora do servidor uma vez (GET /publico/hora). Sem resposta, a faixa usa a hora do aparelho
  // e diz isso.
  function sincronizar(api) {
    if (sincronizando) return sincronizando;
    const t0 = Date.now();
    sincronizando = fetch(String(api || '') + '/publico/hora', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { const s = Date.parse(j && j.agora); if (!isNaN(s)) deslocamento = s - Math.round((t0 + Date.now()) / 2); })
      .catch(() => { sincronizando = null; });
    return sincronizando;
  }

  const fmt = (ms) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit' }).format(new Date(ms)).replace(',', '');
  const agoraBR = () => fmt(Date.now() + (deslocamento || 0));

  // Foto da galeria: o arquivo foi criado/alterado há mais de 10 minutos (a da câmera acabou de nascer)
  const daGaleria = (f) => !!(f && f.lastModified && (Date.now() - f.lastModified) > 10 * 60 * 1000);

  function carregar(arquivo) {
    return new Promise((ok, falha) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não foi possível ler a foto.')); };
      img.src = url;
    });
  }

  // Corta o texto com "…" para caber na largura
  function caber(ctx, texto, largura) {
    if (ctx.measureText(texto).width <= largura) return texto;
    let t = texto;
    while (t.length > 1 && ctx.measureText(t + '…').width > largura) t = t.slice(0, -1);
    return t + '…';
  }

  // Devolve um canvas com a foto reduzida (lado maior = max) e a faixa do carimbo no pé
  async function desenhar(arquivo, opcoes) {
    const o = opcoes || {};
    const max = o.max || 1600;
    const img = await carregar(arquivo);
    const esc = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.max(1, Math.round((img.naturalWidth || img.width) * esc));
    const h = Math.max(1, Math.round((img.naturalHeight || img.height) * esc));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);   // PNG transparente não fica preto
    ctx.drawImage(img, 0, 0, w, h);

    const linhas = [
      `${agoraBR()} (Brasília)${deslocamento === null ? ' · hora do aparelho' : ''}${o.filial ? ' · ' + o.filial : ''}`,
      o.titulo || '',
      daGaleria(arquivo) ? `Foto da galeria · arquivo de ${fmt(arquivo.lastModified)}` : '',
    ].filter(Boolean);
    const fonte = Math.max(12, Math.round(Math.min(w, h) * 0.034));
    const alt = Math.round(fonte * 1.32), pad = Math.round(fonte * 0.55);
    const faixa = pad * 2 + alt * linhas.length;
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, h - faixa, w, faixa);
    ctx.textBaseline = 'top';
    linhas.forEach((t, i) => {
      ctx.font = `${i === 0 ? 700 : 500} ${i === 0 ? fonte : Math.round(fonte * 0.9)}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = i === 2 ? '#fde68a' : '#fff';
      ctx.fillText(caber(ctx, t, w - pad * 2), pad, h - faixa + pad + i * alt);
    });
    return c;
  }

  // Atalhos: dataURL JPEG ou Blob JPEG já carimbados
  async function dataUrl(arquivo, opcoes, qualidade) {
    return (await desenhar(arquivo, opcoes)).toDataURL('image/jpeg', qualidade || 0.82);
  }
  async function blob(arquivo, opcoes, qualidade) {
    const c = await desenhar(arquivo, opcoes);
    return new Promise(ok => c.toBlob(b => ok(b), 'image/jpeg', qualidade || 0.82));
  }

  window.gcaCarimbo = { sincronizar, desenhar, dataUrl, blob, daGaleria, agoraBR };
})();
