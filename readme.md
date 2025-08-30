# GBTS 2.0 - Développement GameBoy avec IA

🤖 **Outil CLI alimenté par l'IA qui convertit le TypeScript en code C GameBoy utilisant Claude AI et OpenAI**

Arrêtez d'écrire vos ROMs GameBoy en C - écrivez-les en TypeScript et laissez l'IA gérer la conversion !

## 🚀 Évolution : De ts2c à l'IA Pure

**GBTS v1.0** utilisait une approche hybride avec le transpiler ts2c pour la conversion TypeScript → C, puis GBDK pour la compilation GameBoy. Bien que fonctionnel, cette méthode présentait des limitations :
- Conversions parfois imprécises nécessitant des ajustements manuels
- Syntaxe TypeScript limitée supportée
- Optimisations GameBoy insuffisantes
- Pas de support pour les projets multi-fichiers

**GBTS 2.0** révolutionne complètement l'approche avec :
- **Transpilation 100% alimentée par l'IA** utilisant Claude 3.5 Sonnet et GPT-4
- **Abandon complet de ts2c** - conversion IA pure avec prompts optimisés GameBoy  
- **🆕 ARCHITECTURE 2 PASSES** - Schéma global puis transpilation avec contexte complet
- **🆕 SUPPORT PROJET COMPLET** - Traitement de dossiers avec plusieurs fichiers TypeScript
- **🆕 CHUNKING INTELLIGENT** - Gros fichiers automatiquement divisés pour surmonter les limites de tokens
- **🆕 COHÉRENCE INTER-FICHIERS** - Chaque chunk connaît TOUS les types/fonctions du projet
- **🆕 RÉSOLUTION DE DÉPENDANCES** - Fichiers traités dans l'ordre correct des imports/exports
- **Cache intelligent** pour réduire les coûts API (~90% d'économies)
- **Support multi-fournisseur** avec basculement automatique
- **Gestion de budget** et suivi des coûts
- **Optimisation spécifique GameBoy** (disposition mémoire, fonctions GBDK)

## 📋 Prérequis

### Clés API IA (Obligatoires)
Vous avez besoin d'au moins un fournisseur IA :

**OpenRouter (Recommandé - Accès unifié) :**
```bash
export OPENROUTER_API_KEY="sk-or-v1-VOTRE-CLE-API-ICI"
```
Obtenez votre clé sur : [openrouter.ai/keys](https://openrouter.ai/keys)
- ✨ Accès à Claude 3.5 Sonnet ET GPT-4 via une seule API
- 💰 Tarifs compétitifs et transparents
- 🔄 Basculement automatique entre modèles

**Claude AI (Direct) :**
```bash
export CLAUDE_API_KEY="sk-ant-VOTRE-CLE-API-ICI"
```
Obtenez votre clé sur : [console.anthropic.com](https://console.anthropic.com/)

**OpenAI (Direct) :**
```bash
export OPENAI_API_KEY="sk-VOTRE-CLE-API-ICI"  
```
Obtenez votre clé sur : [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Compilateur SDCC (Installation Automatique)
Le compilateur SDCC est maintenant installé automatiquement lors de `npm install` !

**Installation manuelle si nécessaire :**

**macOS :**
```bash
brew install sdcc  # Auto-installé par GBTS
```

**Linux (Debian/Ubuntu) :**
```bash
sudo apt install build-essential sdcc sdcc-libraries
```

**Windows :**
Téléchargez SDCC depuis [sourceforge.net/projects/sdcc/files/sdcc-win64](https://sourceforge.net/projects/sdcc/files/sdcc-win64/)
- ✅ Cochez "SDCC SM83 library" (nouvelle architecture GameBoy)
- ✅ Cochez "Add to PATH"

### Node.js
Node.js 18+ requis.

## 🛠️ Installation & Configuration

### Installation Globale (Recommandée)
```bash
# Installation globale depuis npm
npm install -g gbts

# Ou installation locale pour développement
git clone https://github.com/Freuhlon/gbts
cd gbts
npm install
npm run build
```

### Configuration Ultra-Rapide
```bash
# 1. Définir votre clé API (OpenRouter recommandé)
export OPENROUTER_API_KEY="sk-or-v1-VOTRE-CLE-API-ICI"

# 2. GBTS est prêt ! SDCC s'installe automatiquement
gbts --path mon-jeu.ts
```

## 🎮 Utilisation

### Interface Ligne de Commande

```bash
# 🎯 TRAITEMENT FICHIER UNIQUE
gbts --path hello.ts                    # Pipeline complet pour un seul fichier
gbts transpile --path game.ts           # Transpilation IA seulement

# 🚀 TRAITEMENT PROJET ENTIER (NOUVEAU !)
gbts --path ./mon-jeu/                  # Traiter tout le dossier projet  
gbts transpile --path ./src/            # Transpiler tous les .ts du projet
gbts all --path ./projet-jeu/           # Pipeline complet pour projet multi-fichiers

# 📦 SUPPORT GROS FICHIERS (NOUVEAU !) 
# Fichiers >8KB automatiquement découpés en morceaux gérables
gbts transpile --path jeu-enorme.ts     # Auto-chunking pour gros fichiers

# ⚙️ WORKFLOW TRADITIONNEL
gbts compile --path input.ts            # Compiler .c existant vers ROM
gbts build --path input.ts              # Construire ROM depuis fichier .ihx
```

### Options Disponibles

| Option | Description | Exemple |
|--------|-------------|---------|
| `--path, -p` | Chemin vers fichier TypeScript ou dossier projet | `gbts --path ./src/` |
| `--help, -h` | Afficher l'aide | `gbts --help` |
| `--version` | Afficher la version | `gbts --version` |

## 🎯 Démonstration Complète - Hello World sur GameBoy

### 🚀 Objectif : Afficher "HELLO WORLD" au centre de l'écran GameBoy

### Étape 1 : Créer le projet GameBoy
```bash
mkdir mon-premier-jeu-gameboy
cd mon-premier-jeu-gameboy
```

### Étape 2 : Écrire le code TypeScript
Créez `hello-world.ts` :
```typescript
// Hello World centré sur GameBoy - Écrit en TypeScript !
function main() {
    // Message à afficher
    const message = "HELLO WORLD";
    
    // Position pour centrer le texte sur l'écran GameBoy (160x144)
    // Chaque caractère fait 8x8 pixels
    const screenWidth = 20;  // 160 pixels / 8 = 20 caractères
    const messageLength = message.length;
    const startX = Math.floor((screenWidth - messageLength) / 2);
    const centerY = 8;  // Milieu vertical de l'écran
    
    console.log("Initialisation GameBoy...");
    
    // Afficher le message centré
    console.log(`Position: (${startX}, ${centerY})`);
    console.log(message);
    
    // Boucle de jeu simple
    let frameCounter = 0;
    while (true) {
        frameCounter++;
        
        // Animation simple : clignotement toutes les 60 frames
        if (frameCounter % 120 === 0) {
            console.log("*** " + message + " ***");
        }
        
        // Attendre la prochaine frame
        // Cette partie sera optimisée par l'IA pour GameBoy
        for (let i = 0; i < 1000; i++) {
            // Delay simple
        }
        
        // Arrêter après 300 frames pour la démo
        if (frameCounter > 300) {
            break;
        }
    }
    
    console.log("Demo terminée !");
}

// Lancer le programme principal
main();
```

### Étape 3 : Configuration de l'API
```bash
# Définir votre clé API OpenRouter
export OPENROUTER_API_KEY="sk-or-v1-VOTRE-CLE-API-ICI"

# Ou Claude/OpenAI si vous préférez
# export CLAUDE_API_KEY="sk-ant-VOTRE-CLE-API-ICI"
# export OPENAI_API_KEY="sk-VOTRE-CLE-API-ICI"
```

### Étape 4 : Générer la ROM GameBoy
```bash
# Installation globale GBTS (si pas déjà fait)
npm install -g gbts

# Transpilation IA + Compilation ROM complète
gbts all --path hello-world.ts

# 🎯 GBTS va :
# 1. Envoyer votre TypeScript à l'IA (Claude/GPT)
# 2. Recevoir du code C GameBoy optimisé
# 3. Compiler avec SDCC vers assembly GameBoy
# 4. Générer hello-world.gb (ROM finale)
```

### Étape 5 : Examiner le code C généré
```bash
# Voir la traduction IA de votre TypeScript
cat hello-world.c
```

**Exemple de sortie IA :**
```c
#include <gb/gb.h>
#include <stdio.h>

void main() {
    // Initialize GameBoy display
    DISPLAY_ON;
    SHOW_BKG;
    
    // Center position calculation for GameBoy screen
    UINT8 startX = 4;  // Centered position for "HELLO WORLD"
    UINT8 centerY = 8;
    
    // Clear background and set up text display
    printf("\x1b[%d;%dH", centerY, startX);
    printf("HELLO WORLD");
    
    // Main game loop with VBlank synchronization  
    UINT16 frameCounter = 0;
    
    while(1) {
        frameCounter++;
        
        // Blinking animation every 2 seconds (120 frames)
        if(frameCounter % 120 == 0) {
            printf("\x1b[%d;%dH", centerY + 1, startX - 1);
            printf("*** HELLO WORLD ***");
        }
        
        // Wait for VBlank - proper GameBoy timing
        wait_vbl_done();
        
        // Demo end condition
        if(frameCounter > 300) {
            break;
        }
    }
    
    printf("\x1b[10;6H");
    printf("Demo finished!");
    
    // Infinite loop to keep program running
    while(1) {
        wait_vbl_done();
    }
}
```

### Étape 6 : Tester dans un émulateur
```bash
# Vérifier que la ROM est générée
ls -la hello-world.gb

# Lancer dans votre émulateur GameBoy favori
```

**Émulateurs recommandés :**
- **[BGB](https://bgb.bircd.org/)** (Windows) - Excellent debugger
- **[SameBoy](https://sameboy.github.io/)** (Mac/Linux/Windows) - Très précis
- **[mGBA](https://mgba.io/)** (Multi-plateforme) - Interface moderne
- **[Gambatte](https://github.com/sinamas/gambatte)** - Haute précision

### 🎮 Résultat Final

Votre GameBoy affichera :
```
     HELLO WORLD
   *** HELLO WORLD ***
     (clignotant)

   Demo finished!
```

### 📊 Métriques de la démonstration
- **Code TypeScript :** ~50 lignes lisibles
- **Code C généré :** ~40 lignes optimisées GameBoy 
- **ROM finale :** ~32KB (standard GameBoy)
- **Coût IA :** ~$0.01 (très économique)
- **Temps total :** 2-3 minutes de la création à l'exécution !
- **Architecture 2 Passes :** Cohérence garantie même sur projets complexes

### 🔧 Personnalisations possibles
```typescript
// Modifier la couleur du texte
const textColor = 1;  // 0=blanc, 1=gris clair, 2=gris foncé, 3=noir

// Ajouter des sprites de caractères
const playerSprite = [
  0x3C, 0x7E, 0xFF, 0xDB, 0xFF, 0x24, 0x5A, 0x3C
];

// Animation plus complexe
function animateText() {
  // Votre logique d'animation
  // L'IA comprendra et optimisera automatiquement !
}
```

**🚀 En 5 minutes, vous avez créé votre première ROM GameBoy avec TypeScript et IA !**

### 🧠 Gestion des Gros Projets

**Problème résolu : Cohérence sur projets complexes**
- ✅ **Architecture 2 Passes** : Schéma global → Transpilation enrichie
- ✅ **Contexte complet** : Chaque chunk connaît TOUS les types/fonctions
- ✅ **Plus d'incohérences** : Types toujours disponibles entre fichiers
- ✅ **Liens corrects** : Includes et références automatiquement générés

**Exemple projet multi-fichiers :**
```bash
# Projet avec 10+ fichiers TypeScript interdépendants
gbts transpile --path ./mon-gros-jeu/
# → L'IA voit TOUT le projet avant transpilation
# → Cohérence parfaite entre tous les fichiers C générés
```

## ⚙️ Configuration

### Variables d'Environnement
```bash
# Fournisseurs IA
OPENROUTER_API_KEY="sk-or-v1-..."  # OpenRouter (recommandé)
CLAUDE_API_KEY="sk-ant-..."        # Claude direct
OPENAI_API_KEY="sk-..."            # OpenAI direct
GBTS_AI_PROVIDER="openrouter"      # Fournisseur principal

# Gestion Budget  
GBTS_DAILY_BUDGET="5.00"          # Limite dépenses quotidiennes (5,00€)
GBTS_MAX_COST="0.10"              # Coût max par transpilation (0,10€)

# Performance & Chunking
GBTS_DISABLE_CACHE="false"        # Activer/désactiver cache intelligent
GBTS_CHUNK_SIZE="4000"            # Taille max par chunk (4000 chars)
GBTS_MAX_FILE_SIZE="8000"         # Taille fichier avant chunking
```

### Fichier de Configuration (Optionnel)
Créez `gbts.config.json` :
```json
{
  "providers": {
    "primary": "openrouter",
    "fallback": ["claude", "openai"]
  },
  "budget": {
    "dailyBudget": 5.00,
    "maxCostPerTranspilation": 0.10
  },
  "caching": {
    "enabled": true,
    "maxSize": 1000,
    "ttl": 86400000
  },
  "project": {
    "chunkSize": 4000,
    "maxFileSize": 8000,
    "enableModularBuild": true
  }
}
```

## 🛠️ Développement

### Construction & Test
```bash
npm run build          # Compiler TypeScript
npm run typecheck      # Vérification types
npm run lint           # Formatage code (style moderne)
npm test              # Lancer tests
npm run test:watch    # Mode watch
```

### Style de Code
- **TypeScript Moderne** : ES2022, mode strict
- **ESLint** : Pas de points-virgules, guillemets simples, virgules traînantes
- **Tests** : Jest avec appels IA mockés

## 📊 Fonctionnalités IA

### Transpilation Intelligente
- **Prompts optimisés GameBoy** avec contraintes hardware
- **Connaissance fonctions GBDK** pour code GameBoy authentique
- **Optimisation mémoire** (variables zero page, constantes ROM)
- **Notation qualité** et validation

### Gestion Multi-Projets avec Architecture 2 Passes
- **Pass 1 - Schéma Global** : Analyse complète du projet, extraction de tous types/fonctions
- **Pass 2 - Transpilation Enrichie** : Chaque chunk reçoit le contexte complet du projet
- **Cohérence Inter-Fichiers** : Plus d'incohérences entre chunks, types toujours disponibles
- **Analyse dépendances** automatique basée sur imports/exports
- **Chunking intelligent** par fonctions, classes ou blocs logiques
- **Traitement ordonné** des fichiers selon dépendances
- **Support récursif** dossiers (ignore node_modules, dist, .git)

### Gestion Coûts
- **Cache intelligent** réduit appels API de ~90%
- **Suivi budget** empêche dépassements
- **Estimation coût** avant transpilation
- **Système apprentissage** améliore qualité au fil du temps

### Support Multi-Fournisseurs
- **Configuration primaire/secours** 
- **Retry automatique** avec backoff exponentiel
- **Surveillance santé** fournisseurs
- **Répartition charge** entre fournisseurs

## 🔧 Dépannage

### "Aucun fournisseur IA disponible"
```bash
# Vérifier vos clés API
echo $CLAUDE_API_KEY
echo $OPENAI_API_KEY

# Tester connectivité API
gbts transpile --path simple.ts
```

### "Budget quotidien dépassé"
```bash
# Vérifier dépenses actuelles
cat .gbts/ai-cache.json | grep cost

# Augmenter budget
export GBTS_DAILY_BUDGET="10.00"
```

### Erreurs compilation GBDK
```bash
# Vérifier installation SDCC
sdcc --version

# Vérifier chemin GBDK
ls bin/gbdk-n-master/
```

## 📚 Exemples

Plus d'exemples avancés sur : [github.com/Freuhlon/gbts-projects](https://github.com/Freuhlon/gbts-projects)

## 🤝 Contribuer

1. Forker le dépôt
2. Créer branche feature : `git checkout -b feature/fonctionnalite-incroyable`
3. Lancer tests : `npm test`
4. Commit changements : `git commit -m 'Ajout fonctionnalité incroyable'`
5. Push vers branche : `git push origin feature/fonctionnalite-incroyable`
6. Ouvrir Pull Request

## 📄 Licence

Licence ISC - voir fichier [LICENSE](LICENSE) pour détails.

## 🙏 Remerciements

- [GBDK-N](https://github.com/andreasjhkarlsson/gbdk-n) - Kit Développement GameBoy
- [Anthropic Claude](https://www.anthropic.com/) - Moteur transpilation IA
- [OpenAI GPT](https://openai.com/) - Fournisseur IA alternatif
- Concept GBTS original et intégration SDCC

---

**Fait avec 🤖 IA et ❤️ pour le gaming rétro**