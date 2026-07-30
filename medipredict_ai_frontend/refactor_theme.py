import os
import re

directories = ['src/screens', 'src/navigation']
for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if not file.endswith('.tsx'): continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'import { useTheme }' in content or 'const getStyles' in content: continue
            if 'colors' not in content: continue

            # 1. Add useTheme import
            content = re.sub(
                r'import \{([^\}]*colors[^\}]*)\} from \'../theme\'(;?)',
                r"import { useTheme } from '../context/ThemeContext';\nimport { \g<1> } from '../theme'\g<2>",
                content
            )
            # Remove colors from the second import
            content = re.sub(r'import \{([^\}]*)colors\s*,?\s*([^\}]*)\} from \'../theme\'(;?)',
                             r"import { \g<1>\g<2>} from '../theme'\g<3>", content)
            
            # Clean up empty imports
            content = content.replace("import { } from '../theme';", "")

            # 2. Inject hooks inside exported function
            def replacer(match):
                prefix = match.group(0)
                return prefix + "\n    const { colors } = useTheme();\n    const styles = getStyles(colors);\n"

            content = re.sub(r'export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{', replacer, content)
            
            # Handle variable exports like: export const AppNavigator = () => {
            content = re.sub(r'export const [A-Za-z0-9_]+\s*=\s*\([^)]*\)\s*=>\s*\{', replacer, content)

            # 3. Modify StyleSheet.create to getStyles logic
            content = re.sub(
                r'const styles = StyleSheet\.create\(\{',
                r'const getStyles = (colors: any) => StyleSheet.create({',
                content
            )

            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
print('Done!')
