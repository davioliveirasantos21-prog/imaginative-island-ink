import { createFileRoute } from "@tanstack/react-router";
import { zipSync, strToU8 } from "fflate";

// Gera um .zip pronto pra fazer upload no itch.io como jogo HTML5.
// O zip contém um único index.html que carrega o jogo direto do site
// publicado no Lovable via iframe — então qualquer atualização feita no
// Lovable é refletida instantaneamente no itch.io sem precisar re-upload.
const GAME_URL = "https://pixelislandsultimate.lovable.app/game/play";

const INDEX_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
  <title>Pixel Islands</title>
  <style>
    html,body{margin:0;padding:0;height:100%;background:#0d1b2a;overflow:hidden;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#f4e9c1}
    #wrap{position:fixed;inset:0}
    iframe{border:0;width:100%;height:100%;display:block;background:#0d1b2a}
    #boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:2;pointer-events:none;transition:opacity .4s}
    #boot.gone{opacity:0}
    .pulse{width:56px;height:56px;border:4px solid #f4e9c1;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .tag{letter-spacing:.4em;font-size:12px;color:#ffd166}
  </style>
</head>
<body>
  <div id="wrap">
    <iframe id="g"
      src="${GAME_URL}"
      allow="autoplay; fullscreen; gamepad; pointer-lock; clipboard-read; clipboard-write; accelerometer; gyroscope"
      allowfullscreen></iframe>
  </div>
  <div id="boot">
    <div class="pulse"></div>
    <div class="tag">PIXEL ISLANDS</div>
  </div>
  <script>
    var f = document.getElementById('g');
    var b = document.getElementById('boot');
    f.addEventListener('load', function(){
      setTimeout(function(){ b.classList.add('gone'); setTimeout(function(){ b.remove(); }, 500); }, 200);
    });
  </script>
</body>
</html>`;

const README = `Pixel Islands - build para itch.io
=====================================

Como usar:
1. Faça upload do arquivo pixel-islands-itch.zip no seu projeto do itch.io.
2. Marque "This file will be played in the browser".
3. Defina a resolucao (recomendado 1280 x 720) e ative Fullscreen.
4. Pronto. As atualizacoes feitas no Lovable aparecem automaticamente,
   sem precisar re-uploadar nada.

Como funciona:
Este pacote contem um index.html leve que carrega o jogo direto do
site oficial (${GAME_URL}) via iframe. Sem build pesado, sem cache
travado.
`;

export const Route = createFileRoute("/api/public/itch-build")({
  server: {
    handlers: {
      GET: async () => {
        const zipped = zipSync(
          {
            "index.html": strToU8(INDEX_HTML),
            "README.txt": strToU8(README),
          },
          { level: 6 },
        );

        return new Response(zipped, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="pixel-islands-itch.zip"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
