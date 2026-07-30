const fs = require('fs');

const files = [
    'src/navigation/AppNavigator.tsx',
    'src/screens/DiseaseSelectionScreen.tsx',
    'src/screens/HistoryScreen.tsx',
    'src/screens/HomeScreen.tsx',
    'src/screens/ReportsScreen.tsx',
    'src/screens/ResultScreen.tsx',
    'src/screens/SuggestionsScreen.tsx'
];

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('lightColors as colors')) {
        // Find the existing import from '../theme'
        c = c.replace(/import \{[^}]*\} from '\.\.\/theme';?/, match => "import { lightColors as colors } from '../theme';\n" + match);
        fs.writeFileSync(f, c);
    }
});

console.log('Fixed TS references');
