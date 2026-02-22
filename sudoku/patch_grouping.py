
import re
path = '/Users/macbookair/Documents/Antigravity/sudoku/script.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_code = """            if (groups.length > 0) {
                let itemMat = null;
                try {
                    itemMat = cv.imread(item.canvas);
                    cv.cvtColor(itemMat, itemMat, cv.COLOR_RGBA2GRAY, 0);

                    for (const group of groups) {
                        if (!group.canvas || group.canvas.width === 0) continue;
                        let groupMat = cv.imread(group.canvas);
                        cv.cvtColor(groupMat, groupMat, cv.COLOR_RGBA2GRAY, 0);

                        let res = new cv.Mat();
                        cv.matchTemplate(itemMat, groupMat, res, cv.TM_CCOEFF_NORMED);
                        let mm = cv.minMaxLoc(res);
                        
                        if (mm.maxVal > 0.85) {
                            matchedGroup = group;
                            res.delete(); groupMat.delete();
                            break;
                        }
                        res.delete(); groupMat.delete();
                    }
                } catch (e) {
                    console.warn('Grouping failed', e);
                } finally {
                    if (itemMat) itemMat.delete();
                }
            }"""

# Use regex for robustness
pattern = r'if \(groups\.length > 0\) \{.*?itemMat\.delete\(\);.*?\}'
if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, new_code, content, count=1, flags=re.DOTALL)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: Regex replaced')
else:
    print('FAILURE: Pattern not found')
