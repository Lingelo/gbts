# GBTS 2.0 - Développement GameBoy avec IA

🤖 **Outil CLI alimenté par l'IA qui convertit le TypeScript en code C GameBoy utilisant Claude AI et OpenAI**

Arrêtez d'écrire vos ROMs GameBoy en C - écrivez-les en TypeScript et laissez l'IA gérer la conversion !

## 🚀 Nouveautés de la v2.0

GBTS 2.0 est une réécriture complète avec :
- **Transpilation 100% alimentée par l'IA** utilisant Claude 3.5 Sonnet et GPT-4
- **Finies les dépendances ts2c** - conversion IA pure avec prompts optimisés GameBoy  
- **🆕 SUPPORT PROJET COMPLET** - Traitement de dossiers avec plusieurs fichiers TypeScript
- **🆕 CHUNKING INTELLIGENT** - Gros fichiers automatiquement divisés pour surmonter les limites de tokens
- **🆕 RÉSOLUTION DE DÉPENDANCES** - Fichiers traités dans l'ordre correct des imports/exports
- **Cache intelligent** pour réduire les coûts API (~90% d'économies)
- **Support multi-fournisseur** avec basculement automatique
- **Gestion de budget** et suivi des coûts
- **Optimisation spécifique GameBoy** (disposition mémoire, fonctions GBDK)

## 📋 Prérequis

### Clés API IA (Obligatoires)
Vous avez besoin d'au moins un fournisseur IA :

**Claude AI (Recommandé) :**
```bash
export CLAUDE_API_KEY="votre-cle-claude"
```
Obtenez votre clé sur : [console.anthropic.com](https://console.anthropic.com/)

**OpenAI (Alternative) :**
```bash
export OPENAI_API_KEY="votre-cle-openai"  
```
Obtenez votre clé sur : [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Compilateur SDCC
Requis pour compiler le code C généré par l'IA vers les ROMs GameBoy.

**Windows :**
Téléchargez SDCC depuis [sourceforge.net/projects/sdcc/files/sdcc-win64](https://sourceforge.net/projects/sdcc/files/sdcc-win64/)
- ✅ Cochez "SDCC GBZ80 library"
- ✅ Cochez "Add to PATH"

**Linux (Debian/Ubuntu) :**
```bash
sudo apt install build-essential sdcc sdcc-libraries
```

**macOS :**
```bash
brew install sdcc
```

### Node.js
Node.js 18+ requis.

## 🛠️ Installation & Configuration

```bash
# Installer les dépendances
npm install

# Construire le projet  
npm run build

# Installer globalement (optionnel)
npm install -g .
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

## 🎯 Démarrage Rapide - Hello World

### Étape 1 : Créer le fichier TypeScript
Créez `hello.ts` :
```typescript
console.log("Hello GameBoy World!");

// Exemple plus complexe
const joueur = {
  x: 80,
  y: 72,
  sprite: 0
};

function mettreAJourJoueur() {
  if (joueur.x < 160) {
    joueur.x += 1;
  }
}
```

### Étape 2 : Générer la ROM GameBoy
```bash
# Définir votre clé API
export CLAUDE_API_KEY="votre-cle-api-ici"

# Convertir vers ROM GameBoy
gbts --path hello.ts
```

### Étape 3 : Lancer dans l'Émulateur
Le fichier `hello.gb` généré peut être lancé dans n'importe quel émulateur GameBoy :
- [BGB](https://bgb.bircd.org/) (Windows)
- [SameBoy](https://sameboy.github.io/) (Multi-plateforme)
- [mGBA](https://mgba.io/) (Multi-plateforme)

## ⚙️ Configuration

### Variables d'Environnement
```bash
# Fournisseurs IA
CLAUDE_API_KEY="sk-ant-..."        # Clé API Claude
OPENAI_API_KEY="sk-..."           # Clé API OpenAI
GBTS_AI_PROVIDER="claude"         # Fournisseur principal (claude/openai)

# Gestion Budget  
GBTS_DAILY_BUDGET="5.00"          # Limite dépenses quotidiennes (5,00€)
GBTS_MAX_COST="0.10"              # Coût max par transpilation (0,10€)

# Performance & Chunking
GBTS_DISABLE_CACHE="false"        # Activer/désactiver cache
GBTS_CHUNK_SIZE="4000"            # Taille max par chunk (4000 chars)
GBTS_MAX_FILE_SIZE="8000"         # Taille fichier avant chunking
```

### Fichier de Configuration (Optionnel)
Créez `gbts.config.json` :
```json
{
  "providers": {
    "primary": "claude",
    "fallback": ["openai"]
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

### Gestion Multi-Projets
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