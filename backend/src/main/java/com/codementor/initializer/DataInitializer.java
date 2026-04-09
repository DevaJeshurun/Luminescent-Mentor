package com.codementor.initializer;

import com.codementor.model.PracticeProblem;
import com.codementor.model.RoadmapTopic;
import com.codementor.repository.PracticeProblemRepository;
import com.codementor.repository.RoadmapTopicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private RoadmapTopicRepository topicRepo;
    @Autowired private PracticeProblemRepository problemRepo;

    @Override
    public void run(String... args) {
        if (topicRepo.count() == 0) seedRoadmapTopics();
        if (problemRepo.count() == 0) seedProblems();
    }

    private void seedRoadmapTopics() {
        List<RoadmapTopic> topics = List.of(
            RoadmapTopic.builder().topicOrder(1).name("Java Basics").category("FUNDAMENTALS").level("BEGINNER").estimatedHours(8).icon("☕")
                .description("Variables, data types, operators, control flow, loops — the foundation of Java programming.")
                .whyItMatters("Every Java program is built on these fundamentals. Without them, nothing else works.")
                .commonMistakes("Confusing == with .equals(), integer overflow, ignoring null checks.")
                .timeComplexity("N/A").spaceComplexity("N/A")
                .practiceProblems("FizzBuzz,Fibonacci,Palindrome Check,Sum of Digits,Reverse a Number")
                .interviewQuestions("Difference between JDK/JRE/JVM?,What is autoboxing?,Explain pass-by-value in Java.").build(),

            RoadmapTopic.builder().topicOrder(2).name("OOP Concepts").category("FUNDAMENTALS").level("BEGINNER").estimatedHours(10).icon("🏗️")
                .description("Classes, objects, inheritance, polymorphism, encapsulation, and abstraction.")
                .whyItMatters("OOP is the backbone of Java. Every real project uses these principles.")
                .commonMistakes("Overusing inheritance, breaking encapsulation, not understanding polymorphism.")
                .timeComplexity("N/A").spaceComplexity("N/A")
                .practiceProblems("Design a Bank Account,Animal Hierarchy,Shape Calculator,Library System,Employee Payroll")
                .interviewQuestions("Explain SOLID principles,Difference between abstract class and interface?,What is method overriding vs overloading?").build(),

            RoadmapTopic.builder().topicOrder(3).name("Arrays").category("DATA_STRUCTURES").level("BEGINNER").estimatedHours(6).icon("📊")
                .description("Fixed-size contiguous memory structures. Foundation of most DSA problems.")
                .whyItMatters("Arrays appear in 70% of coding interviews. Master them first.")
                .commonMistakes("Off-by-one errors, ArrayIndexOutOfBounds, not handling edge cases.")
                .timeComplexity("O(1) access, O(n) search").spaceComplexity("O(n)")
                .practiceProblems("Two Sum,Max Subarray,Rotate Array,Find Duplicates,Move Zeros")
                .interviewQuestions("How to find missing number in 1..n?,Explain Kadane's algorithm,Difference between array and ArrayList?").build(),

            RoadmapTopic.builder().topicOrder(4).name("Strings").category("DATA_STRUCTURES").level("BEGINNER").estimatedHours(5).icon("🔤")
                .description("String manipulation, StringBuilder, common string algorithms.")
                .whyItMatters("String problems appear heavily in Google, Amazon interviews.")
                .commonMistakes("Using + concatenation in loops (use StringBuilder), ignoring Unicode.")
                .timeComplexity("O(n) for most ops").spaceComplexity("O(n)")
                .practiceProblems("Valid Anagram,Longest Substring Without Repeats,Group Anagrams,Valid Parentheses,Roman to Integer")
                .interviewQuestions("Why are Strings immutable in Java?,String vs StringBuilder vs StringBuffer?,How does String pool work?").build(),

            RoadmapTopic.builder().topicOrder(5).name("Recursion").category("ALGORITHMS").level("BEGINNER").estimatedHours(8).icon("🔄")
                .description("Function calling itself to solve subproblems. Base case + recursive case.")
                .whyItMatters("Required for Trees, Graphs, DP, Backtracking — all advanced topics.")
                .commonMistakes("Missing base case (StackOverflow), not reducing problem size.")
                .timeComplexity("Varies — O(2^n) naive").spaceComplexity("O(n) call stack")
                .practiceProblems("Factorial,Power of x^n,Subsets,Permutations,Tower of Hanoi")
                .interviewQuestions("How to convert recursion to iteration?,What is tail recursion?,Explain memoization.").build(),

            RoadmapTopic.builder().topicOrder(6).name("Time Complexity").category("FUNDAMENTALS").level("BEGINNER").estimatedHours(4).icon("⏱️")
                .description("Big-O notation. Analyze algorithm efficiency: O(1), O(n), O(log n), O(n²).")
                .whyItMatters("Every interview solution must be analyzed for complexity. Non-negotiable.")
                .commonMistakes("Ignoring constants, confusing average vs worst case.")
                .timeComplexity("Analysis tool").spaceComplexity("Analysis tool")
                .practiceProblems("Count operations,Find nested loop complexity,Log N analysis,Amortized analysis,Master theorem")
                .interviewQuestions("What is amortized complexity?,O(n log n) vs O(n²)?,Best case of QuickSort?").build(),

            RoadmapTopic.builder().topicOrder(7).name("Sorting Algorithms").category("ALGORITHMS").level("INTERMEDIATE").estimatedHours(8).icon("🔃")
                .description("Bubble, Selection, Insertion, Merge Sort, Quick Sort, Heap Sort.")
                .whyItMatters("Sorting is foundational. Merge Sort and Quick Sort appear in every interview.")
                .commonMistakes("Using wrong sort for the use case, not knowing stability of sorts.")
                .timeComplexity("O(n log n) average").spaceComplexity("O(1) to O(n)")
                .practiceProblems("Sort Colors,Merge Intervals,Kth Largest Element,Sort by Frequency,Custom Sort")
                .interviewQuestions("When use Merge vs Quick Sort?,How is Arrays.sort() implemented in Java?,What is counting sort?").build(),

            RoadmapTopic.builder().topicOrder(8).name("Searching Algorithms").category("ALGORITHMS").level("BEGINNER").estimatedHours(4).icon("🔍")
                .description("Linear search, Binary Search, and search on answer techniques.")
                .whyItMatters("Binary Search reduces O(n) to O(log n). Critical optimization skill.")
                .commonMistakes("Off-by-one in binary search, not sorting before applying binary search.")
                .timeComplexity("O(log n) binary search").spaceComplexity("O(1)")
                .practiceProblems("Binary Search,Search Rotated Array,Find Peak Element,sqrt(x),First Bad Version")
                .interviewQuestions("How to apply binary search on answer?,Iterative vs recursive binary search?,Lower bound vs upper bound?").build(),

            RoadmapTopic.builder().topicOrder(9).name("Linked Lists").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(7).icon("🔗")
                .description("Singly/Doubly linked lists, operations, reversal, cycle detection.")
                .whyItMatters("Heavily tested at Amazon, Microsoft. Tests pointer manipulation skills.")
                .commonMistakes("Losing reference to next node, not handling null, cycle bugs.")
                .timeComplexity("O(n) traversal, O(1) insert/delete").spaceComplexity("O(n)")
                .practiceProblems("Reverse Linked List,Delete N-th from End,Merge Two Sorted Lists,Detect Cycle,Find Middle")
                .interviewQuestions("How Floyd's cycle detection works?,Difference between array and linked list?,When to use linked list?").build(),

            RoadmapTopic.builder().topicOrder(10).name("Stack & Queue").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(6).icon("📚")
                .description("LIFO stack, FIFO queue, monotonic stack, deque, priority queue.")
                .whyItMatters("Used in DFS, BFS, expression evaluation, sliding window problems.")
                .commonMistakes("Using wrong data structure, not using Deque for stack in Java.")
                .timeComplexity("O(1) push/pop").spaceComplexity("O(n)")
                .practiceProblems("Valid Parentheses,Min Stack,Daily Temperature,Sliding Window Maximum,Decode String")
                .interviewQuestions("Stack vs Queue vs Deque?,How to implement queue using stacks?,What is monotonic stack?").build(),

            RoadmapTopic.builder().topicOrder(11).name("Trees & Binary Trees").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(10).icon("🌳")
                .description("Tree traversals (inorder, preorder, postorder, level-order), height, diameter.")
                .whyItMatters("Trees are in 30% of interview problems. Master traversals first.")
                .commonMistakes("Confusing traversal orders, not handling null nodes.")
                .timeComplexity("O(n) traversal").spaceComplexity("O(h) recursion stack")
                .practiceProblems("Maximum Depth,Same Tree,Invert Tree,Path Sum,Level Order Traversal")
                .interviewQuestions("DFS vs BFS for trees?,How to serialize/deserialize a tree?,Balanced tree check?").build(),

            RoadmapTopic.builder().topicOrder(12).name("Binary Search Tree").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(6).icon("🌲")
                .description("BST properties, insertion, deletion, validation, LCA, kth smallest.")
                .whyItMatters("BST problems test understanding of tree invariants and recursion.")
                .commonMistakes("Breaking BST property during insertion/deletion.")
                .timeComplexity("O(log n) avg, O(n) worst").spaceComplexity("O(n)")
                .practiceProblems("Validate BST,Insert/Delete in BST,Kth Smallest,LCA in BST,BST to Sorted Array")
                .interviewQuestions("BST vs Hash Map — when to use which?,How to balance a BST?,Inorder of BST gives sorted array?").build(),

            RoadmapTopic.builder().topicOrder(13).name("Heaps & Priority Queue").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(5).icon("⛰️")
                .description("Min heap, max heap, heapify, top-K problems, PriorityQueue in Java.")
                .whyItMatters("Heaps are the go-to for top-K, median, and scheduling problems.")
                .commonMistakes("Using wrong heap type (min vs max), heap sort confusion.")
                .timeComplexity("O(log n) insert/delete").spaceComplexity("O(n)")
                .practiceProblems("Kth Largest,Find Median from Stream,Top K Frequent,Merge K Sorted Lists,Task Scheduler")
                .interviewQuestions("Min heap vs Max heap?,How heapify works?,PriorityQueue in Java — natural ordering?").build(),

            RoadmapTopic.builder().topicOrder(14).name("Graphs").category("DATA_STRUCTURES").level("INTERMEDIATE").estimatedHours(12).icon("🕸️")
                .description("BFS, DFS, adjacency list/matrix, directed/undirected, weighted graphs, topological sort.")
                .whyItMatters("Graphs model real-world problems: maps, social networks, dependencies.")
                .commonMistakes("Not marking visited nodes (infinite loop), wrong graph representation.")
                .timeComplexity("O(V+E) BFS/DFS").spaceComplexity("O(V+E)")
                .practiceProblems("Number of Islands,Clone Graph,Course Schedule,Pacific Atlantic Water Flow,Word Ladder")
                .interviewQuestions("BFS vs DFS?,Detect cycle in directed graph?,Topological sort algorithms?").build(),

            RoadmapTopic.builder().topicOrder(15).name("Dynamic Programming").category("ALGORITHMS").level("ADVANCED").estimatedHours(20).icon("💡")
                .description("Memoization, tabulation, 1D/2D DP, classic patterns: knapsack, LCS, LIS.")
                .whyItMatters("DP is the hardest and most rewarding topic. Appears in every FAANG interview.")
                .commonMistakes("Not identifying subproblems, wrong state definition, forgetting base cases.")
                .timeComplexity("Usually O(n²) or O(n*m)").spaceComplexity("O(n) to O(n*m)")
                .practiceProblems("Climbing Stairs,Coin Change,Longest Common Subsequence,0/1 Knapsack,House Robber")
                .interviewQuestions("Top-down vs bottom-up DP?,How to identify a DP problem?,Space optimization in DP?").build(),

            RoadmapTopic.builder().topicOrder(16).name("Greedy Algorithms").category("ALGORITHMS").level("ADVANCED").estimatedHours(6).icon("🎯")
                .description("Making locally optimal choices at each step. Intervals, scheduling, Huffman coding.")
                .whyItMatters("Greedy gives O(n log n) solutions where DP would be O(n²).")
                .commonMistakes("Applying greedy when DP is needed, not proving greedy correctness.")
                .timeComplexity("Usually O(n log n)").spaceComplexity("O(1) to O(n)")
                .practiceProblems("Jump Game,Meeting Rooms,Gas Station,Minimum Platforms,Activity Selection")
                .interviewQuestions("When is greedy safe to use?,Greedy vs DP?,Prove greedy for interval scheduling.").build(),

            RoadmapTopic.builder().topicOrder(17).name("Backtracking").category("ALGORITHMS").level("ADVANCED").estimatedHours(8).icon("↩️")
                .description("Exhaustive search with pruning. N-Queens, Sudoku, permutations, subsets.")
                .whyItMatters("Backtracking solves constraint satisfaction problems that brute force can't handle.")
                .commonMistakes("Not backtracking (resetting state), over-pruning.")
                .timeComplexity("O(b^d) exponential").spaceComplexity("O(d) recursion depth")
                .practiceProblems("N-Queens,Sudoku Solver,Word Search,Combination Sum,Palindrome Partitioning")
                .interviewQuestions("Backtracking vs recursion?,How to prune search space?,Time complexity of N-Queens?").build(),

            RoadmapTopic.builder().topicOrder(18).name("Tries").category("DATA_STRUCTURES").level("ADVANCED").estimatedHours(5).icon("🌐")
                .description("Prefix tree for string operations. Insert, search, startsWith, word dictionary.")
                .whyItMatters("Tries solve prefix/autocomplete problems in O(L) vs O(n*L) for hashmap.")
                .commonMistakes("Confusing end-of-word marker, not handling overlapping prefixes.")
                .timeComplexity("O(L) per operation").spaceComplexity("O(ALPHABET_SIZE * L * N)")
                .practiceProblems("Implement Trie,Word Search II,Replace Words,Design Search Autocomplete,Longest Word in Dictionary")
                .interviewQuestions("Trie vs HashMap for strings?,Use cases of Trie?,Space optimization of Trie?").build(),

            RoadmapTopic.builder().topicOrder(19).name("Graph Advanced (Dijkstra, Union-Find)").category("ALGORITHMS").level("ADVANCED").estimatedHours(10).icon("🗺️")
                .description("Dijkstra's shortest path, Bellman-Ford, Floyd-Warshall, Union-Find/DSU, Kruskal's MST.")
                .whyItMatters("Used in network routing, social graphs, geographic apps. Common in senior interviews.")
                .commonMistakes("Negative edges with Dijkstra, not using path compression in Union-Find.")
                .timeComplexity("Dijkstra O((V+E) log V)").spaceComplexity("O(V+E)")
                .practiceProblems("Network Delay Time,Cheapest Flights,Redundant Connection,Min Cost to Connect Points,Critical Connections")
                .interviewQuestions("When use Dijkstra vs Bellman-Ford?,Union-Find with path compression?,Kruskal's vs Prim's MST?").build(),

            RoadmapTopic.builder().topicOrder(20).name("System Design Basics").category("SYSTEM_DESIGN").level("ADVANCED").estimatedHours(15).icon("🏛️")
                .description("Scalability, CAP theorem, load balancing, caching, databases, microservices, API design.")
                .whyItMatters("System design rounds are mandatory for senior roles at FAANG companies.")
                .commonMistakes("Starting with implementation before clarifying requirements, ignoring scalability.")
                .timeComplexity("N/A").spaceComplexity("N/A")
                .practiceProblems("Design URL Shortener,Design Twitter,Design WhatsApp,Design Netflix,Design Uber")
                .interviewQuestions("SQL vs NoSQL?,Horizontal vs vertical scaling?,What is consistent hashing?").build()
        );
        topicRepo.saveAll(topics);
    }

    private void seedProblems() {
        List<PracticeProblem> problems = List.of(
            PracticeProblem.builder().title("Two Sum").difficulty("EASY").category("Arrays").companyTags("Google,Amazon,Meta")
                .description("Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.")
                .timeComplexity("O(n)").spaceComplexity("O(n)")
                .hints("Use a HashMap to store complement values.")
                .javaSolution("public int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> map = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int comp = target - nums[i];\n        if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n        map.put(nums[i], i);\n    }\n    return new int[]{};\n}")
                .javaTemplate("public int[] twoSum(int[] nums, int target) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Valid Parentheses").difficulty("EASY").category("Stack").companyTags("Google,Microsoft,Amazon")
                .description("Given a string s containing '(', ')', '{', '}', '[', ']', determine if the input string is valid.")
                .timeComplexity("O(n)").spaceComplexity("O(n)")
                .hints("Use a stack. Push opening brackets, pop and match closing brackets.")
                .javaSolution("public boolean isValid(String s) {\n    Deque<Character> stack = new ArrayDeque<>();\n    for (char c : s.toCharArray()) {\n        if (c=='(' || c=='{' || c=='[') stack.push(c);\n        else {\n            if (stack.isEmpty()) return false;\n            char top = stack.pop();\n            if (c==')' && top!='(') return false;\n            if (c=='}' && top!='{') return false;\n            if (c==']' && top!='[') return false;\n        }\n    }\n    return stack.isEmpty();\n}")
                .javaTemplate("public boolean isValid(String s) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Reverse Linked List").difficulty("EASY").category("Linked Lists").companyTags("Amazon,Facebook,Microsoft")
                .description("Given the head of a singly linked list, reverse the list, and return the reversed list.")
                .timeComplexity("O(n)").spaceComplexity("O(1)")
                .hints("Use three pointers: prev, curr, next.")
                .javaSolution("public ListNode reverseList(ListNode head) {\n    ListNode prev = null, curr = head;\n    while (curr != null) {\n        ListNode next = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = next;\n    }\n    return prev;\n}")
                .javaTemplate("public ListNode reverseList(ListNode head) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Maximum Subarray").difficulty("MEDIUM").category("Arrays").companyTags("Amazon,Google,Apple")
                .description("Given an integer array nums, find the subarray with the largest sum, and return its sum.")
                .timeComplexity("O(n)").spaceComplexity("O(1)")
                .hints("Kadane's Algorithm: track current sum and reset when negative.")
                .javaSolution("public int maxSubArray(int[] nums) {\n    int maxSum = nums[0], curr = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        curr = Math.max(nums[i], curr + nums[i]);\n        maxSum = Math.max(maxSum, curr);\n    }\n    return maxSum;\n}")
                .javaTemplate("public int maxSubArray(int[] nums) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Binary Search").difficulty("EASY").category("Searching").companyTags("Google,Facebook,Microsoft")
                .description("Given a sorted array of n integers and a target value, return the index if found, else return -1.")
                .timeComplexity("O(log n)").spaceComplexity("O(1)")
                .hints("Use left and right pointers. Shrink the search space by half each time.")
                .javaSolution("public int search(int[] nums, int target) {\n    int l = 0, r = nums.length - 1;\n    while (l <= r) {\n        int mid = l + (r - l) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) l = mid + 1;\n        else r = mid - 1;\n    }\n    return -1;\n}")
                .javaTemplate("public int search(int[] nums, int target) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Climbing Stairs").difficulty("EASY").category("Dynamic Programming").companyTags("Amazon,Google,Uber")
                .description("You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb?")
                .timeComplexity("O(n)").spaceComplexity("O(1)")
                .hints("This is Fibonacci! dp[i] = dp[i-1] + dp[i-2].")
                .javaSolution("public int climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        int c = a + b; a = b; b = c;\n    }\n    return b;\n}")
                .javaTemplate("public int climbStairs(int n) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Maximum Depth of Binary Tree").difficulty("EASY").category("Trees").companyTags("Amazon,Google,LinkedIn")
                .description("Given the root of a binary tree, return its maximum depth (number of nodes along the longest path).")
                .timeComplexity("O(n)").spaceComplexity("O(h)")
                .hints("DFS: return 1 + max(left depth, right depth). Base case: null = 0.")
                .javaSolution("public int maxDepth(TreeNode root) {\n    if (root == null) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}")
                .javaTemplate("public int maxDepth(TreeNode root) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Merge Two Sorted Lists").difficulty("EASY").category("Linked Lists").companyTags("Amazon,Google,Microsoft")
                .description("Merge two sorted linked lists and return it as a sorted list.")
                .timeComplexity("O(n+m)").spaceComplexity("O(1)")
                .hints("Use a dummy node. Compare heads and advance the smaller pointer.")
                .javaSolution("public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n    ListNode dummy = new ListNode(0);\n    ListNode curr = dummy;\n    while (l1 != null && l2 != null) {\n        if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }\n        else { curr.next = l2; l2 = l2.next; }\n        curr = curr.next;\n    }\n    curr.next = l1 != null ? l1 : l2;\n    return dummy.next;\n}")
                .javaTemplate("public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Number of Islands").difficulty("MEDIUM").category("Graphs").companyTags("Amazon,Google,Facebook")
                .description("Given an m x n 2D binary grid representing a map of land('1') and water('0'), return the number of islands.")
                .timeComplexity("O(m*n)").spaceComplexity("O(m*n)")
                .hints("DFS/BFS from each unvisited '1'. Sink visited land by marking as '0'.")
                .javaSolution("public int numIslands(char[][] grid) {\n    int count = 0;\n    for (int i=0;i<grid.length;i++) for (int j=0;j<grid[0].length;j++)\n        if (grid[i][j]=='1') { dfs(grid,i,j); count++; }\n    return count;\n}\nvoid dfs(char[][] g, int i, int j) {\n    if (i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]!='1') return;\n    g[i][j]='0';\n    dfs(g,i+1,j); dfs(g,i-1,j); dfs(g,i,j+1); dfs(g,i,j-1);\n}")
                .javaTemplate("public int numIslands(char[][] grid) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Coin Change").difficulty("MEDIUM").category("Dynamic Programming").companyTags("Amazon,Google,Lyft")
                .description("Given coins of different denominations and a total amount, return the fewest number of coins to make up that amount.")
                .timeComplexity("O(amount * coins)").spaceComplexity("O(amount)")
                .hints("Bottom-up DP. dp[i] = min coins for amount i. dp[0]=0, rest=infinity.")
                .javaSolution("public int coinChange(int[] coins, int amount) {\n    int[] dp = new int[amount+1];\n    Arrays.fill(dp, amount+1);\n    dp[0] = 0;\n    for (int i=1;i<=amount;i++)\n        for (int c : coins)\n            if (c<=i) dp[i] = Math.min(dp[i], dp[i-c]+1);\n    return dp[amount] > amount ? -1 : dp[amount];\n}")
                .javaTemplate("public int coinChange(int[] coins, int amount) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("LRU Cache").difficulty("HARD").category("Design").companyTags("Amazon,Google,Facebook,Microsoft")
                .description("Design a data structure that follows the Least Recently Used cache constraints with O(1) get and put.")
                .timeComplexity("O(1)").spaceComplexity("O(capacity)")
                .hints("Use LinkedHashMap or combine HashMap + Doubly Linked List.")
                .javaSolution("class LRUCache extends LinkedHashMap<Integer,Integer> {\n    int cap;\n    public LRUCache(int capacity) { super(capacity, 0.75f, true); this.cap = capacity; }\n    public int get(int k) { return super.getOrDefault(k, -1); }\n    public void put(int k, int v) { super.put(k, v); }\n    protected boolean removeEldestEntry(Map.Entry e) { return size() > cap; }\n}")
                .javaTemplate("class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) {}\n    public void put(int key, int value) {}\n}").build(),

            PracticeProblem.builder().title("Longest Substring Without Repeating Characters").difficulty("MEDIUM").category("Strings").companyTags("Amazon,Adobe,Google")
                .description("Given a string s, find the length of the longest substring without repeating characters.")
                .timeComplexity("O(n)").spaceComplexity("O(min(n,m))")
                .hints("Sliding window with a HashSet. Expand right, shrink left on duplicate.")
                .javaSolution("public int lengthOfLongestSubstring(String s) {\n    Set<Character> set = new HashSet<>();\n    int l=0, max=0;\n    for (int r=0; r<s.length(); r++) {\n        while (set.contains(s.charAt(r))) set.remove(s.charAt(l++));\n        set.add(s.charAt(r));\n        max = Math.max(max, r-l+1);\n    }\n    return max;\n}")
                .javaTemplate("public int lengthOfLongestSubstring(String s) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Course Schedule").difficulty("MEDIUM").category("Graphs").companyTags("Amazon,Google,Uber")
                .description("There are numCourses courses. Given prerequisites pairs, determine if you can finish all courses.")
                .timeComplexity("O(V+E)").spaceComplexity("O(V+E)")
                .hints("Topological sort / cycle detection in directed graph using DFS or BFS (Kahn's).")
                .javaSolution("public boolean canFinish(int n, int[][] prereqs) {\n    List<List<Integer>> adj = new ArrayList<>();\n    for (int i=0;i<n;i++) adj.add(new ArrayList<>());\n    int[] inDeg = new int[n];\n    for (int[] p:prereqs) { adj.get(p[1]).add(p[0]); inDeg[p[0]]++; }\n    Queue<Integer> q = new LinkedList<>();\n    for (int i=0;i<n;i++) if (inDeg[i]==0) q.add(i);\n    int done=0;\n    while (!q.isEmpty()) { int c=q.poll(); done++;\n        for (int nb:adj.get(c)) if (--inDeg[nb]==0) q.add(nb); }\n    return done==n;\n}")
                .javaTemplate("public boolean canFinish(int numCourses, int[][] prerequisites) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Word Search").difficulty("MEDIUM").category("Backtracking").companyTags("Amazon,Microsoft,Bloomberg")
                .description("Given an m x n grid of characters and a string word, return true if word exists in the grid.")
                .timeComplexity("O(m*n*4^L)").spaceComplexity("O(L)")
                .hints("DFS backtracking. Mark cell as visited, recurse in 4 directions, unmark on return.")
                .javaSolution("public boolean exist(char[][] board, String word) {\n    for (int i=0;i<board.length;i++) for (int j=0;j<board[0].length;j++)\n        if (dfs(board,word,i,j,0)) return true;\n    return false;\n}\nboolean dfs(char[][] b, String w, int i, int j, int k) {\n    if (k==w.length()) return true;\n    if (i<0||i>=b.length||j<0||j>=b[0].length||b[i][j]!=w.charAt(k)) return false;\n    char tmp=b[i][j]; b[i][j]='#';\n    boolean res=dfs(b,w,i+1,j,k+1)||dfs(b,w,i-1,j,k+1)||dfs(b,w,i,j+1,k+1)||dfs(b,w,i,j-1,k+1);\n    b[i][j]=tmp; return res;\n}")
                .javaTemplate("public boolean exist(char[][] board, String word) {\n    // Your solution here\n}").build(),

            PracticeProblem.builder().title("Trapping Rain Water").difficulty("HARD").category("Arrays").companyTags("Amazon,Google,Apple,Goldman Sachs")
                .description("Given n non-negative integers representing an elevation map of width 1, compute how much water it can trap after raining.")
                .timeComplexity("O(n)").spaceComplexity("O(1)")
                .hints("Two pointers. Water at each bar = min(max_left, max_right) - height[i].")
                .javaSolution("public int trap(int[] height) {\n    int l=0, r=height.length-1, maxL=0, maxR=0, water=0;\n    while (l<r) {\n        if (height[l]<height[r]) {\n            if (height[l]>=maxL) maxL=height[l]; else water+=maxL-height[l];\n            l++;\n        } else {\n            if (height[r]>=maxR) maxR=height[r]; else water+=maxR-height[r];\n            r--;\n        }\n    }\n    return water;\n}")
                .javaTemplate("public int trap(int[] height) {\n    // Your solution here\n}").build()
        );
        problemRepo.saveAll(problems);
    }
}
