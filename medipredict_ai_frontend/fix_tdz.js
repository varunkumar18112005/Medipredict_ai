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
    
    // Change `const getStyles = (colors: any) => StyleSheet.create({`
    // to `const getStyles = (colors: any) => StyleSheet.create({`... wait, I can just hoist it by using `var getStyles` or `function getStyles`!
    if (content.includes('const getStyles = (colors')) {
        content = content.replace(
            /const getStyles = \(colors[^\)]*\)\s*=>\s*StyleSheet\.create\(\{/g,
            'var getStyles = (colors: any) => StyleSheet.create({'
        );
        fs.writeFileSync(filepath, content, 'utf8');
    }
});

console.log('Fixed TDZ hoisting!');
