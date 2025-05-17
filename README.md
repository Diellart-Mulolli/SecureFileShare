# 🔐 SecureFile – Menaxhim i File-ave me Enkriptim
> Një aplikacion i thjeshtë por funksional për ruajtjen, editimin dhe ndarjen e skedarëve në mënyrë të sigurt duke përdorur **kriptim hibrid (RSA + AES)**.

---

##  Çfarë bën ky projekt?

-  **Regjistrim dhe Hyrje (Login)** me gjenerim automatik të çelësave RSA për çdo përdorues.
-  **Krijim i skedarëve të rinj** (tekst ose imazh) me **kriptim të avancuar AES-256**.
-  **Editim dhe shikim i skedarëve** të kriptuar (vetëm nëse ke leje).
-  **Ndarje skedarësh** me përdorues të tjerë (read-only ose read-write).
-  Funksionon si një sistem lokal (mock database), pa backend.

---

##  Teknologjitë e përdorura

| Teknologji        | Përshkrimi                           |
|-------------------|--------------------------------------|
| HTML, CSS, JS     | Frontend dhe logjika kryesore        |
| Bootstrap 5       | Dizajni dhe modalet responsive       |
| Web Crypto API    | Kriptimi RSA & AES në nivel shfletues|
| JavaScript Modules| Modularizimi i kodit për punë në grup|

---

##  Struktura e projektit

Projekti ndahet në disa skedarë për funksionalitete specifike:

```
📁 js/
├── auth.js           # Regjistrim, login, logout
├── fileManager.js    # Krijimi & kriptimi i skedarëve
├── fileEditor.js     # Editimi dhe shikimi i skedarëve
├── share.js          # Ndarja e skedarëve
└── main.js           # Inicializimi dhe lidhja e eventeve
```

---

##  Siguria në fokus

- Çdo përdorues ka çelësat e tij **RSA 2048-bit** për të ruajtur dhe ndarë skedarë.
- Çdo skedar (tekst apo imazh) kriptohet me **AES-256 GCM**.
- Ndarja bëhet përmes **re-enkriptimit të çelësit simetrik** për përdoruesin marrës.

---

##  Si ta testoni?

1. Hapni `index.html` në një browser (Chrome/Edge/Firefox).
2. Regjistrohuni me një emër përdoruesi të ri.
3. Ngarkoni një skedar të ri (tekst ose imazh).
4. Bëni logout dhe provoni të hyni me një llogari tjetër për të testuar ndarjen.

---

##  Ekipi

Ky projekt është zhvilluar nga:
1. Diellart Mulolli
2. Diell Fazliu
3. Delvina Elshani
4. Dren Xhyliqi

---

##  Na kontaktoni

Na kontaktoni për pyetje, sugjerime apo bashkëpunim të mëtejshëm. Mund të përdorni seksionin e Issues në GitHub, ose të na shkruani personalisht

---

> Faleminderit!
