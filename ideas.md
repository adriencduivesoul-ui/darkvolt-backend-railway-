# DarkVolt — Brainstorm Design

## Approche 1 — "Voltage Noir" (Cyberpunk Industriel)
<response>
<text>
**Design Movement:** Cyberpunk Industriel / Neue Brutalisme Digital

**Core Principles:**
- Asymétrie radicale : grilles brisées, éléments qui "débordent" des conteneurs
- Contraste extrême : noir absolu vs vert fluo coupant
- Texture industrielle : grain, noise, scanlines CRT, distorsion glitch
- Hiérarchie par l'énergie : les éléments importants "rayonnent" de la lumière

**Color Philosophy:**
Le noir #050505 comme vide cosmique, le vert #39FF14 comme électricité pure — une couleur qui ne peut pas exister naturellement, seulement dans les circuits. Le rouge #FF1A1A comme danger, sang, alarme. Ensemble : une palette qui crie "underground" sans compromis.

**Layout Paradigm:**
Grille asymétrique 12 colonnes avec des éléments qui cassent les lignes. Hero fullscreen avec contenu décalé à gauche. Sections alternant entre pleine largeur et compositions fragmentées. Bento grid avec cellules de tailles très variées (1x1, 2x1, 1x2, 3x1).

**Signature Elements:**
- Lignes de "scan" horizontales animées (CRT effect)
- Bordures néon avec glow pulsant
- Texte avec effet glitch (décalage RGB)

**Interaction Philosophy:**
Chaque hover déclenche une micro-décharge électrique. Les transitions sont rapides et agressives (cut, flash) plutôt que douces.

**Animation:**
- Glitch : décalage aléatoire des canaux RGB sur les titres
- Pulse : glow qui s'intensifie et se relâche comme un battement
- Scan : lignes qui traversent les éléments de haut en bas
- Particules : étincelles qui jaillissent des éléments actifs

**Typography System:**
- Titres : Orbitron (bold 900) — angulaire, électrique, futuriste
- Sous-titres : Bebas Neue — impact, condensé, agressif
- Corps : Space Grotesk — moderne, lisible, légèrement technique
</text>
<probability>0.08</probability>
</response>

## Approche 2 — "Abyssal Frequency" (Horror Électronique)
<response>
<text>
**Design Movement:** Dark Ambient Horror / Occult Digital

**Core Principles:**
- Profondeur abyssale : couches de transparence, brouillard, obscurité progressive
- Organique vs Digital : formes fluides qui contrastent avec la géométrie dure
- Révélation progressive : contenu qui émerge de l'obscurité au scroll
- Tension visuelle : éléments qui semblent "vivants" et instables

**Color Philosophy:**
Le noir comme néant, le vert comme bioluminescence d'une créature des profondeurs, le rouge comme sang qui suinte. La palette évoque un organisme cybernétique vivant dans les ténèbres.

**Layout Paradigm:**
Composition centrée mais avec des éléments qui "poussent" depuis les bords. Sections avec des transitions en fondu depuis le noir. Bento grid avec des cellules qui semblent flotter dans l'obscurité.

**Signature Elements:**
- Smoke/brouillard animé en arrière-plan
- Texte qui apparaît comme s'il était gravé dans le métal
- Waveform audio comme élément décoratif récurrent

**Interaction Philosophy:**
Interactions lentes et viscérales. Hover = le contenu "respire". Scroll = révélation depuis les ténèbres.

**Animation:**
- Smoke : particules de fumée en mouvement lent
- Reveal : éléments qui émergent du noir avec un glow
- Breathe : scale très subtile (1.0 → 1.02) en boucle
- Waveform : animation de fréquence audio continue

**Typography System:**
- Titres : Metal Mania ou Cinzel Decorative — gothique, gravé
- Corps : Raleway — élégant, aéré
</text>
<probability>0.06</probability>
</response>

## Approche 3 — "Electric Underground" (Rave Cyberpunk) ← SÉLECTIONNÉE
<response>
<text>
**Design Movement:** Rave Culture Cyberpunk / New Brutalism Digital

**Core Principles:**
- Énergie brute : tout vibre, pulse, rayonne — rien n'est statique
- Contraste maximal : noir absolu + couleurs qui "brûlent" l'écran
- Fragmenté mais cohérent : composition en fragments qui forment un tout
- Immersion totale : le visiteur est "dans" la fréquence, pas devant

**Color Philosophy:**
#050505 = le vide entre les étoiles. #39FF14 = l'électricité pure, la fréquence visible. #FF1A1A = l'intensité maximale, le danger, la passion. Ces trois couleurs ne coexistent pas — elles se combattent et créent de l'énergie dans leur tension.

**Layout Paradigm:**
Fullscreen sections avec des compositions diagonales. Le contenu suit des lignes d'énergie plutôt que des grilles. Bento grid avec des cellules qui ont des bordures néon et des effets de profondeur. Navigation flottante minimaliste.

**Signature Elements:**
- Canvas WebGL avec particules d'énergie en mouvement
- Bordures avec effet "electricity" (SVG animé)
- Typographie avec effet glitch RGB sur hover

**Interaction Philosophy:**
Chaque interaction est une décharge. Hover = flash d'énergie. Click = explosion de particules. Scroll = l'énergie se déplace avec le visiteur.

**Animation:**
- Particles : système de particules canvas avec connexions dynamiques
- Glitch : décalage RGB aléatoire sur les titres (0.1s, toutes les 3-5s)
- Neon pulse : glow box-shadow qui pulse (0.8s ease-in-out infinite)
- Waveform : barres audio animées en CSS/JS
- Split reveal : préloader avec split screen gauche/droite

**Typography System:**
- Titres principaux : Orbitron Black (900) — angulaire, électrique, futuriste
- Titres secondaires : Bebas Neue — impact maximal, condensé
- Corps de texte : Space Grotesk Regular/Medium — technique, moderne, lisible
- Accent/labels : Space Mono — monospace, code, underground
</text>
<probability>0.09</probability>
</response>

## Décision finale : Approche 3 — "Electric Underground"
Direction choisie pour son énergie brute, son immersion totale et sa cohérence avec l'univers DarkVolt.
