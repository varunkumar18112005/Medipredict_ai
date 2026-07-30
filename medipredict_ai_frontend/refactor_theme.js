const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    if(!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    });
    return filelist;
};

const directories = ['src/screens', 'src/navigation'];
let files = [];
directories.forEach(d => {
    files = files.concat(walkSync(d));
});

files.forEach(filepath => {
    if (!filepath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filepath, 'utf8');
    
    if (content.includes('import { useTheme }') || content.includes('const getStyles')) return;
    if (!content.includes('colors')) return;

    // 1. Add useTheme import
    content = content.replace(
        /import \{([^}]*colors[^}]*)\} from '\.\.\/theme'(;?)/g,
        "import { useTheme } from '../context/ThemeContext';\nimport { $1 } from '../theme'$2"
    );
    // Remove colors from the second import
    content = content.replace(
        /import \{([^}]*)colors\s*,?\s*([^}]*)\} from '\.\.\/theme'(;?)/g,
        "import { $1$2} from '../theme'$3"
    );
    
    // Clean up empty imports
    content = content.replace("import { } from '../theme';", "").replace("import { \n} from '../theme';", "");

    // 2. Inject hooks inside exported function
    const replacer = (match) => {
        return match + "\n    const { colors } = useTheme();\n    const styles = getStyles(colors);\n";
    };

    content = content.replace(/export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{/g, replacer);
    content = content.replace(/export const [A-Za-z0-9_]+\s*=\s*\([^)]*\)\s*=>\s*\{/g, replacer);

    // 3. Modify StyleSheet.create to getStyles logic
    content = content.replace(
        /const styles = StyleSheet\.create\(\{/g,
        'const getStyles = (colors: any) => StyleSheet.create({'
    );

    fs.writeFileSync(filepath, content, 'utf8');
});

console.log('Script executed perfectly!');
