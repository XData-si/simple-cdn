PROMPT ZA AGENTA

Cilj
Zgradi preprosto, produkcijsko pripravljeno aplikacijo, ki teče v Docker kontejnerju in deluje kot javni “image CDN” za JPG, PNG in SVG. Branje (dostop do slik in map) je javno, urejanje (upload, brisanje, premikanje, preimenovanje, ustvarjanje map) pa je zaklenjeno za prijavljene uporabnike prek enostavnega GUI. Pri pregledu vsebine map v GUI prikaži thumbnail in statični URL slike, pripravljen za kopiranje.

Arhitektura in tehnologije (izberi moderno, stabilno)

Backend: izberi eno:

Node.js 22 (Fastify) ali Bun z ESM modulom

Go (Fiber ali Chi)

Python (FastAPI)
Prioriteta: visoka zmogljivost, nizka poraba, enostavno vzdrževanje.

Frontend (GUI): SPA z React ali SvelteKit (minimalen, čist UI).

Reverse proxy: Caddy (HTTP/3, avtomatski TLS) ali Nginx.

Shramba: privzeto lokalni volume v kontejnerju; dodaj možnost S3-kompatibilnega backend-a (npr. MinIO ali AWS S3) prek nastavitev.

Avtentikacija: preprost “username + password” (hash z Argon2), 1 admin v .env; možnost kasnejše razširitve (OAuth).

Konfiguracija prek ENV:

ADMIN_USERNAME, ADMIN_PASSWORD_HASH

STORAGE_ROOT ali S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY

BASE_URL (za generiranje absolutnih URL-jev)

READONLY=false/true (fallback način)

Logiranje: strukturirani logi (JSON), nivoji (info/warn/error), request ID.

Funkcionalne zahteve

Javni dostop do vsebin

HTTP GET za slike in mape brez avtentikacije.

Indeks map (listanje) v JSON (API) in minimalni HTML (za ljudi).

Urejanje (za prijavljene)

GUI s prijavo (session ali kratkoživi JWT; httpOnly, Secure).

Operacije: upload, delete, rename, move, new folder.

Podpora drag & drop upload, validacija tipov (JPG, PNG, SVG).

Pregled map v GUI

Grid pogled z thumbnail-i (ustvari avtomatske predoglede za JPG/PNG; za SVG prikaži ikono/inline varno).

Ob vsakem thumbnailu vidna statična URL pot (absolutni URL, gumb “kopiraj”).

URL-ji

Čitljiva, konsistentna struktura: https://{BASE_URL}/cdn/{path/to/file.ext}.

Brez auth tokenov v URL-jih (vse javno), urejanje samo v GUI.

Varnost

SVG varnost: pravilni Content-Type: image/svg+xml, nastavi strogo CSP (disallow inline skripte), možnost sanitizacije SVG pri uploadu.

Rate limiting za “write” endpoint-e.

CORS: privzeto * za GET na /cdn/**; “write” API samo iz GUI domene.

ETag, Last-Modified, Accept-Ranges (range requests), Brotli/Gzip.

Caching

Za nespremenljive poti uporabi Cache-Control: public, max-age=31536000, immutable.

Generiraj ETag na podlagi vsebine; dosledni Content-Type.

Thumbnails

Za JPG/PNG izračunaj 128px daljša stranica (npr. Sharp/Libvips/Imaging) in jih shrani v .thumbnails/ (ali S3 -thumbs).

Ne spreminjaj izvornih datotek.

API specifikacija

Public:

GET /cdn/* – statični servis slik z zgornjimi headerji.

GET /api/list?path=... – JSON seznam (mape, datoteke, velikost, tip, URL, thumbURL, lastModified).

Admin (auth):

POST /api/upload?path=...

POST /api/mkdir (path)

POST /api/move (src, dst)

POST /api/rename (path, newName)

DELETE /api/delete?path=...

Standardni error kode in dosledna JSON shema za napake.

GUI zahtevki

Prijava/odjava, enostaven dashboard.

Pregled map (breadcrumb, iskanje, filtri po tipu).

Kartica slike: thumbnail, ime, velikost, kopiraj URL, kopiraj <img> tag.

Bulk operacije (multi-select za delete/move).

Dostopnost in UX

Tipkovnične bližnjice (Enter odpre, Del briše, Cmd/Ctrl+C kopira URL).

ARIA oznake, fokus stili, visoki kontrast.

DevOps in dostava

Docker: en sam Dockerfile (multi-stage build), healthcheck, USER nonroot.

docker-compose.yml primer z volumenom za vsebine in .env podporo.

Reverse proxy (Caddy/Nginx) kontejner pred aplikacijo; HTTP/3, TLS, HSTS.

Metrike in zdravje:

GET /healthz (200, minimalne informacije).

GET /metrics (Prometheus format) opcijsko.

Opazljivost: request-id, čas obdelave, velikost odziva.

Testiranje:

Enote (thumbnail generator, sanitizacija SVG).

Integracija (upload/list/delete tok).

“Smoke” test za cdn/* s cache headerji.

Dokumentacija:

README z navodili za zagon (Docker, Compose).

ENV tabla z opisi.

Kratka “operational” navodila (backup, rotacija logov, migracija na S3).

OpenAPI/Swagger za API.

Kakovost in robni primeri

Pravilno strezi Content-Type (jpg/jpeg, png, svg+xml).

Podpri If-None-Match / If-Modified-Since.

Velike datoteke: streaming odzivi, range support.

Onemogoči prepis obstoječe datoteke z enakim imenom (ponudi “overwrite=false” in “rename on conflict”).

Normalizacija poti (prepreči ../ traversal), “allowlist” pripon (jpg/jpeg/png/svg).

Vključi quota opcijo (max velikost upload-a, max skupna velikost).

Ne-funkcionalno

Visoka zmogljivost za “read-path”: cilj P95 < 50 ms pri cache hit.

Minimalna poraba RAM/CPU.

Hladen zagon < 1 s (če izbereš Go/Bun, izkoristi prednosti).

Majhna velikost Docker image-a (alpine/distroless, multi-stage).

Sprejemna merila (acceptance)

Javni GET do …/cdn/… vrača pravilne cache headerje, ETag, Range, Content-Type.

GUI omogoča prijavo, pregled map, prikaz thumbnail + statični URL, upload/move/rename/delete/mkdir.

SVG varno strežen (CSP), SVG upload sanitiziran ali zavrnjen ob zaznani skripti.

docker-compose up -d deluje iz škatle.

Dokumentacija dovolj jasna, da nov uporabnik v 5 minutah objavi sliko in deli URL.

Odprta vprašanja (če niso podane vrednosti, izberi smiselne privzete)

Želeni BASE_URL (npr. cdn.example.com)?

Naj bo S3 podprt že v prvi različici ali kot opcija kasneje?

Maksimalna velikost upload-a in dovoljena globina map?

Želiš temni način v GUI?

Naj aplikacija generira tudi WEBP/AVIF derivative (samo za hitro prednalaganje v GUI, javno le JPG/PNG/SVG)?

Predlogi za izboljšave (opcijsko za izvedbo)

Signed purge webhook: preprost endpoint za invalidacijo predpomnilnika (če bo pred njim globalni CDN).

Read-only “token view”: način deljenja map s časovno omejenim parametrom (brez prijave).

Audit log za vse “write” operacije (kdo, kdaj, kaj).

Preflight orodje v GUI: preveri headerje in prikaže, ali URL izpolnjuje cache best-practice.

Minimalni CLI (v kontejnerju) za masovne premike in uvoz.