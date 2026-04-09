import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Save, Trash2, Download, RefreshCw, ChevronDown, Brain, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { codeAPI } from '../api'

const LANGUAGES = [
  { value: 'JAVA', label: 'Java', monacoLang: 'java', defaultCode: `public class Main {
    public static void main(String[] args) {
        // Write your Java code here
        System.out.println("Hello, CodeMentor AI!");
        
        // Example: Two Sum
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] result = twoSum(nums, target);
        System.out.println("Two Sum: [" + result[0] + ", " + result[1] + "]");
    }
    
    public static int[] twoSum(int[] nums, int target) {
        java.util.HashMap<Integer, Integer> map = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}` },
  { value: 'PYTHON', label: 'Python', monacoLang: 'python', defaultCode: `# Write your Python code here
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    print("Hello, CodeMentor AI!")
    print(two_sum([2, 7, 11, 15], 9))
` },
  { value: 'CPP', label: 'C++', monacoLang: 'cpp', defaultCode: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int comp = target - nums[i];
        if (map.count(comp)) return {map[comp], i};
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    cout << "Hello, CodeMentor AI!" << endl;
    vector<int> nums = {2, 7, 11, 15};
    auto res = twoSum(nums, 9);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}` },
]

const TEMPLATES = [
  { name: 'Binary Search', lang: 'JAVA', code: `public class Main {\n    public static int binarySearch(int[] arr, int target) {\n        int l = 0, r = arr.length - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return -1;\n    }\n    public static void main(String[] args) {\n        int[] arr = {1,3,5,7,9,11,13};\n        System.out.println(binarySearch(arr, 7)); // 3\n    }\n}` },
  { name: 'Linked List', lang: 'JAVA', code: `public class Main {\n    static class ListNode { int val; ListNode next; ListNode(int v){val=v;} }\n    public static ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) { ListNode next = curr.next; curr.next = prev; prev = curr; curr = next; }\n        return prev;\n    }\n    public static void main(String[] args) {\n        ListNode head = new ListNode(1);\n        head.next = new ListNode(2); head.next.next = new ListNode(3);\n        ListNode rev = reverseList(head);\n        while(rev != null) { System.out.print(rev.val + " "); rev = rev.next; }\n    }\n}` },
  { name: 'BFS Tree', lang: 'JAVA', code: `import java.util.*;\npublic class Main {\n    static class TreeNode { int val; TreeNode left, right; TreeNode(int v){val=v;} }\n    public static List<List<Integer>> levelOrder(TreeNode root) {\n        List<List<Integer>> res = new ArrayList<>();\n        if (root == null) return res;\n        Queue<TreeNode> q = new LinkedList<>();\n        q.add(root);\n        while (!q.isEmpty()) {\n            int size = q.size();\n            List<Integer> level = new ArrayList<>();\n            for (int i=0;i<size;i++) {\n                TreeNode node = q.poll();\n                level.add(node.val);\n                if (node.left != null) q.add(node.left);\n                if (node.right != null) q.add(node.right);\n            }\n            res.add(level);\n        }\n        return res;\n    }\n    public static void main(String[] args) {\n        TreeNode root = new TreeNode(3);\n        root.left = new TreeNode(9); root.right = new TreeNode(20);\n        System.out.println(levelOrder(root));\n    }\n}` },
]

export default function Playground() {
  const [lang, setLang] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].defaultCode)
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('console')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const editorRef = useRef(null)

  const runCode = async () => {
    setRunning(true)
    setActiveTab('console')
    try {
      const r = await codeAPI.run({ code, language: lang.value, stdin })
      setResult(r.data)
      if (r.data.success) toast.success('Code executed successfully!')
      else if ((r.data?.error || '').toLowerCase().includes('execution service unavailable')) toast.error('Execution service unavailable')
      else toast.error('Compilation/Runtime error detected')
    } catch (e) {
      toast.error('Execution failed')
      setResult({ error: e.message, success: false })
    } finally { setRunning(false) }
  }

  const changeLang = (l) => {
    setLang(l); setCode(l.defaultCode); setResult(null); setShowLangMenu(false)
  }

  const downloadCode = () => {
    const ext = { JAVA: 'java', PYTHON: 'py', CPP: 'cpp' }[lang.value] || 'txt'
    const blob = new Blob([code], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `Main.${ext}`; a.click()
  }

  const saveSnippet = async () => {
    try {
      await codeAPI.saveSnippet({ title: `Snippet ${Date.now()}`, language: lang.value, code })
      toast.success('Snippet saved!')
    } catch { toast.error('Failed to save') }
  }

  const timeCx = result?.timeComplexity || ''
  const spaceCx = result?.spaceComplexity || ''

  return (
    <div className="flex h-full bg-dark-950">
      {/* Templates sidebar */}
      <div className="w-48 bg-dark-800 border-r border-dark-300 flex flex-col shrink-0">
        <div className="p-3 border-b border-dark-300">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Templates</h3>
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => { setCode(t.code); const l = LANGUAGES.find(x => x.value === t.lang); if (l) setLang(l) }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-dark-600 hover:text-white transition-all">
              📄 {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main editor + panels */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-b border-dark-300">
          {/* Language picker */}
          <div className="relative">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 btn-ghost py-1.5 px-3 text-xs">
              {lang.label} <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full left-0 mt-1 card shadow-xl p-1 z-50 w-32">
                  {LANGUAGES.map(l => (
                    <button key={l.value} onClick={() => changeLang(l)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${lang.value === l.value ? 'text-coral bg-coral/10' : 'text-gray-300 hover:bg-dark-500'}`}>
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-4 w-px bg-dark-300" />
          <button onClick={runCode} disabled={running}
            className="btn-primary flex items-center gap-2 py-1.5 px-4 text-xs">
            {running ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={12} fill="white" />}
            {running ? 'Running...' : 'Run Code'}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={saveSnippet} className="btn-icon p-1.5" title="Save Snippet"><Save size={13} /></button>
            <button onClick={downloadCode} className="btn-icon p-1.5" title="Download"><Download size={13} /></button>
            <button onClick={() => setCode(lang.defaultCode)} className="btn-icon p-1.5" title="Reset"><RefreshCw size={13} /></button>
            <button onClick={() => setCode('')} className="btn-icon p-1.5" title="Clear"><Trash2 size={13} /></button>
          </div>
        </div>

        {/* Editor + Output */}
        <div className="flex-1 flex min-h-0">
          {/* Monaco Editor */}
          <div className="flex-1 min-w-0">
            <Editor
              height="100%"
              language={lang.monacoLang}
              value={code}
              onChange={v => setCode(v || '')}
              onMount={ed => { editorRef.current = ed }}
              theme="vs-dark"
              options={{
                fontSize: 13, fontFamily: '"JetBrains Mono", monospace', minimap: { enabled: false },
                lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on',
                formatOnPaste: true, suggestOnTriggerCharacters: true, tabSize: 4,
                renderLineHighlight: 'gutter', cursorBlinking: 'smooth',
              }}
            />
          </div>

          {/* Right panel: AI Analysis */}
          {result && (
            <div className="w-72 border-l border-dark-300 bg-dark-800 p-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-coral" />
                <h3 className="text-sm font-bold text-white">AI Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="card p-3">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Status</div>
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${result.success ? 'text-emerald' : 'text-coral'}`}>
                    {result.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {result.success ? 'Execution Successful' : 'Runtime Error'}
                  </div>
                </div>
                <div className="card p-3">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Execution Time</div>
                  <div className="flex items-center gap-1.5 text-amber font-mono text-sm">
                    <Clock size={13} />{result.executionTime || 0}ms
                  </div>
                </div>
                <div className="card p-3">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Time Complexity</div>
                  <div className="text-coral font-mono text-xs">{timeCx || 'Not available yet'}</div>
                </div>
                <div className="card p-3">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Space Complexity</div>
                  <div className="text-violet-300 font-mono text-xs">{spaceCx || 'Not available yet'}</div>
                </div>
                {result.aiAnalysis && (
                  <div className="card p-3">
                    <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Zap size={9} className="text-coral" /> AI Insights
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{result.aiAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom panel */}
        <div className="h-48 border-t border-dark-300 bg-dark-800 flex flex-col">
          <div className="flex items-center gap-1 px-4 pt-2 pb-0 border-b border-dark-300">
            {['console', 'stdin', 'output'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  activeTab === tab ? 'text-coral border-b-2 border-coral' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-xs">
            {activeTab === 'stdin' && (
              <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Enter stdin input here..."
                className="w-full h-full bg-transparent text-gray-300 outline-none resize-none placeholder-gray-700" />
            )}
            {activeTab === 'console' && (
              running ? (
                <div className="flex items-center gap-2 text-amber">
                  <span className="w-3 h-3 border border-amber/30 border-t-amber rounded-full animate-spin" />
                  Compiling and running...
                </div>
              ) : result ? (
                <div>
                  {result.output && <pre className="text-emerald whitespace-pre-wrap">{result.output}</pre>}
                  {result.error && <pre className="text-coral whitespace-pre-wrap mt-2">{result.error}</pre>}
                  {!result.output && !result.error && <span className="text-gray-600">No output</span>}
                </div>
              ) : <span className="text-gray-700">Run your code to see output here...</span>
            )}
            {activeTab === 'output' && result && (
              <div>
                <div className="text-gray-500 mb-1">[{new Date().toLocaleTimeString()}] Execution complete</div>
                {result.success
                  ? <div className="text-emerald">✓ Process exited with code 0</div>
                  : <div className="text-coral">✗ Process exited with non-zero code</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
