const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'study', name: 'Study & Education', icon: '📚' },
  { id: 'business', name: 'Business & Professional', icon: '💼' },
  { id: 'creative', name: 'Creative & Design', icon: '🎨' },
  { id: 'personal', name: 'Personal & Life', icon: '🏠' },
  { id: 'ops', name: 'Business Operations', icon: '⚙️' },
  { id: 'health', name: 'Health & Wellness', icon: '💪' },
  { id: 'team', name: 'Team & Collaboration', icon: '👥' }
];

const BOARD_TEMPLATES = [
  // ── Study & Education ────────────────────────────────────────────────
  {
    id: 'exam-prep',
    category: 'study',
    name: 'Exam Prep',
    description: 'Organize study materials, key concepts, and practice questions for upcoming exams.',
    items: [
      { type: 'rich_note', title: 'Exam Overview', content: 'Course: [Course Name]\nDate: [Exam Date]\nFormat: Multiple choice + Essay\nWeight: 40% of final grade', position_x: 100, position_y: 80, width: 320, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Key Topics', content: '1. Chapter 1-3 Review\n2. Core Theories\n3. Case Studies\n4. Practice Problems', position_x: 480, position_y: 80, width: 280, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Study Schedule', content: 'Week 1: Chapters 1-3\nWeek 2: Chapters 4-6\nWeek 3: Practice tests\nWeek 4: Final review', position_x: 100, position_y: 320, width: 280, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Weak Areas', content: 'Focus on:\n- Complex formulas\n- Historical dates\n- Essay structure', position_x: 440, position_y: 320, width: 280, height: 180, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Resources', content: 'Textbook chapters\nLecture slides\nPast exams\nStudy group notes', position_x: 800, position_y: 80, width: 260, height: 160, color: '#af52de20' },
      { type: 'sticky_note', title: 'Confidence Tracker', content: 'Topic 1: [ ] Need work\nTopic 2: [ ] Need work\nTopic 3: [ ] Need work\nTopic 4: [ ] Need work', position_x: 800, position_y: 300, width: 260, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'lecture-notes',
    category: 'study',
    name: 'Lecture Notes',
    description: 'Capture and organize lecture content with key takeaways and action items.',
    items: [
      { type: 'rich_note', title: 'Lecture Info', content: 'Course: [Course Name]\nInstructor: [Name]\nDate: [Date]\nTopic: [Lecture Topic]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'rich_note', title: 'Main Notes', content: 'Key concepts from today:\n- Concept 1\n- Concept 2\n- Concept 3', position_x: 100, position_y: 300, width: 400, height: 250, color: '#ffffff' },
      { type: 'sticky_note', title: 'Key Takeaways', content: '1. Important formula\n2. Historical event\n3. Theory explanation', position_x: 560, position_y: 80, width: 280, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Questions', content: 'Ask about:\n- Clarification on concept 2\n- Additional examples\n- Reading for next class', position_x: 560, position_y: 320, width: 280, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Action Items', content: 'Complete by Friday:\n- Read chapter 5\n- Practice problems 1-10\n- Review notes from last week', position_x: 900, position_y: 80, width: 280, height: 180, color: '#ff3b3020' }
    ]
  },
  {
    id: 'research-board',
    category: 'study',
    name: 'Research Board',
    description: 'Organize research papers, hypotheses, and findings in a visual workspace.',
    items: [
      { type: 'rich_note', title: 'Research Question', content: 'Primary question:\n[Your research question here]\n\nSecondary questions:\n1. [Sub-question 1]\n2. [Sub-question 2]\n3. [Sub-question 3]', position_x: 100, position_y: 80, width: 340, height: 200, color: '#007aff20' },
      { type: 'sticky_note', title: 'Literature Review', content: 'Source 1: [Author, Year]\n- Key finding\n\nSource 2: [Author, Year]\n- Key finding\n\nSource 3: [Author, Year]\n- Key finding', position_x: 100, position_y: 340, width: 340, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Methodology', content: 'Approach: [Qualitative/Quantitative]\nData collection:\n- Surveys\n- Interviews\n- Observations\nSample size: [N]', position_x: 500, position_y: 80, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Hypothesis', content: 'H1: [First hypothesis]\nH2: [Second hypothesis]\nH3: [Third hypothesis]\n\nNull hypothesis: [H0]', position_x: 500, position_y: 340, width: 280, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Findings', content: 'Result 1: [Description]\nResult 2: [Description]\nResult 3: [Description]\n\nNext steps: [Action items]', position_x: 840, position_y: 80, width: 300, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'References', content: '1. Author, A. (Year). Title.\n2. Author, B. (Year). Title.\n3. Author, C. (Year). Title.', position_x: 840, position_y: 340, width: 300, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'language-learning',
    category: 'study',
    name: 'Language Learning',
    description: 'Track vocabulary, grammar rules, and progress in language study.',
    items: [
      { type: 'rich_note', title: 'Language Goals', content: 'Target Language: [Language]\nProficiency Level: [A1-C2]\nGoal: [Conversational/Fluent/Native]\nTimeline: [X months]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'New Vocabulary', content: 'Word 1 - Meaning\nWord 2 - Meaning\nWord 3 - Meaning\nWord 4 - Meaning\nWord 5 - Meaning', position_x: 100, position_y: 300, width: 260, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Grammar Notes', content: 'Rule: [Grammar rule]\nExample: [Example sentence]\n\nRule: [Grammar rule]\nExample: [Example sentence]', position_x: 420, position_y: 80, width: 280, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Practice Sentences', content: '1. [Your sentence]\n2. [Your sentence]\n3. [Your sentence]\n\nCorrections needed:', position_x: 420, position_y: 340, width: 280, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Cultural Notes', content: 'Customs:\n- [Cultural practice 1]\n- [Cultural practice 2]\n\nIdioms:\n- [Idiom 1] - meaning\n- [Idiom 2] - meaning', position_x: 760, position_y: 80, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Progress Log', content: 'Day 1: [What you practiced]\nDay 2: [What you practiced]\nDay 3: [What you practiced]', position_x: 760, position_y: 340, width: 280, height: 160, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'book-summary',
    category: 'study',
    name: 'Book Summary',
    description: 'Summarize key ideas, quotes, and personal insights from books.',
    items: [
      { type: 'rich_note', title: 'Book Details', content: 'Title: [Book Title]\nAuthor: [Author Name]\nGenre: [Genre]\nPages: [Number]\nRating: [X/5]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Summary', content: 'Main argument:\n[Core thesis of the book]\n\nKey chapters:\n1. [Chapter 1 summary]\n2. [Chapter 2 summary]\n3. [Chapter 3 summary]', position_x: 100, position_y: 300, width: 340, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Key Quotes', content: '"[Memorable quote 1]"\n— Page X\n\n"[Memorable quote 2]"\n— Page Y', position_x: 500, position_y: 80, width: 320, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Key Takeaways', content: '1. [Main insight 1]\n2. [Main insight 2]\n3. [Main insight 3]\n4. [Main insight 4]', position_x: 500, position_y: 320, width: 320, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Personal Reflection', content: 'How this applies to my life:\n- [Application 1]\n- [Application 2]\n\nQuestions to explore:\n- [Question 1]', position_x: 880, position_y: 80, width: 300, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Action Items', content: 'Books to read next:\n- [Book 1]\n- [Book 2]\n\nApply these concepts:\n- [Concept 1]\n- [Concept 2]', position_x: 880, position_y: 340, width: 300, height: 180, color: '#30d15820' }
    ]
  },
  {
    id: 'flashcards',
    category: 'study',
    name: 'Flashcards',
    description: 'Create digital flashcards for active recall study sessions.',
    items: [
      { type: 'sticky_note', title: 'Card 1', content: 'Q: What is [concept]?\nA: [Definition]\n\nHint: [Memory aid]', position_x: 100, position_y: 80, width: 260, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Card 2', content: 'Q: [Question 2]\nA: [Answer 2]\n\nHint: [Memory aid]', position_x: 420, position_y: 80, width: 260, height: 160, color: '#34c75920' },
      { type: 'sticky_note', title: 'Card 3', content: 'Q: [Question 3]\nA: [Answer 3]\n\nHint: [Memory aid]', position_x: 740, position_y: 80, width: 260, height: 160, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Card 4', content: 'Q: [Question 4]\nA: [Answer 4]\n\nHint: [Memory aid]', position_x: 1060, position_y: 80, width: 260, height: 160, color: '#af52de20' },
      { type: 'sticky_note', title: 'Card 5', content: 'Q: [Question 5]\nA: [Answer 5]\n\nHint: [Memory aid]', position_x: 100, position_y: 300, width: 260, height: 160, color: '#ff648220' },
      { type: 'sticky_note', title: 'Card 6', content: 'Q: [Question 6]\nA: [Answer 6]\n\nHint: [Memory aid]', position_x: 420, position_y: 300, width: 260, height: 160, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Study Stats', content: 'Total cards: 6\nMastered: 0\nNeeds review: 6\n\nNext session: [Date]', position_x: 740, position_y: 300, width: 260, height: 160, color: '#ffd60a20' }
    ]
  },

  // ── Business & Professional ──────────────────────────────────────────
  {
    id: 'kanban',
    category: 'business',
    name: 'Kanban Board',
    description: 'Track work items across To Do, In Progress, and Done columns.',
    items: [
      { type: 'rich_note', title: 'To Do', content: '- Task 1: Description\n- Task 2: Description\n- Task 3: Description\n\nAdd new tasks here', position_x: 100, position_y: 80, width: 300, height: 300, color: '#007aff20' },
      { type: 'rich_note', title: 'In Progress', content: '- Task 4: Description\n  Owner: [Name]\n  Due: [Date]\n\n- Task 5: Description\n  Owner: [Name]\n  Due: [Date]', position_x: 460, position_y: 80, width: 300, height: 300, color: '#ff9f0a20' },
      { type: 'rich_note', title: 'In Review', content: '- Task 6: Description\n  Reviewer: [Name]\n  Status: Pending\n\n- Task 7: Description\n  Reviewer: [Name]\n  Status: Approved', position_x: 820, position_y: 80, width: 300, height: 300, color: '#af52de20' },
      { type: 'rich_note', title: 'Done', content: '- Task 8: Completed [Date]\n- Task 9: Completed [Date]\n- Task 10: Completed [Date]\n\nTotal completed this week: 3', position_x: 1180, position_y: 80, width: 300, height: 300, color: '#34c75920' },
      { type: 'sticky_note', title: 'WIP Limit', content: 'Max in progress: 5\nCurrent: 2\n\nBlockers:\n- [Blocker 1]\n- [Blocker 2]', position_x: 460, position_y: 440, width: 300, height: 160, color: '#ff3b3020' }
    ]
  },
  {
    id: 'swot',
    category: 'business',
    name: 'SWOT Analysis',
    description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats.',
    items: [
      { type: 'rich_note', title: 'Strengths', content: '+ [Strength 1]\n+ [Strength 2]\n+ [Strength 3]\n+ [Strength 4]\n+ [Strength 5]', position_x: 100, position_y: 80, width: 340, height: 220, color: '#34c75920' },
      { type: 'rich_note', title: 'Weaknesses', content: '- [Weakness 1]\n- [Weakness 2]\n- [Weakness 3]\n- [Weakness 4]\n- [Weakness 5]', position_x: 500, position_y: 80, width: 340, height: 220, color: '#ff3b3020' },
      { type: 'rich_note', title: 'Opportunities', content: '+ [Opportunity 1]\n+ [Opportunity 2]\n+ [Opportunity 3]\n+ [Opportunity 4]\n+ [Opportunity 5]', position_x: 100, position_y: 360, width: 340, height: 220, color: '#007aff20' },
      { type: 'rich_note', title: 'Threats', content: '- [Threat 1]\n- [Threat 2]\n- [Threat 3]\n- [Threat 4]\n- [Threat 5]', position_x: 500, position_y: 360, width: 340, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Strategic Implications', content: 'Leverage strengths to\nmaximize opportunities\n\nMitigate threats by\naddressing weaknesses', position_x: 900, position_y: 180, width: 300, height: 180, color: '#af52de20' }
    ]
  },
  {
    id: 'business-model',
    category: 'business',
    name: 'Business Model Canvas',
    description: 'Map out your business model with the 9 building blocks.',
    items: [
      { type: 'sticky_note', title: 'Key Partners', content: '- Partner 1\n- Partner 2\n- Partner 3\n\nSuppliers:', position_x: 100, position_y: 80, width: 240, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Key Activities', content: '- Activity 1\n- Activity 2\n- Activity 3\n\nCore competencies:', position_x: 400, position_y: 80, width: 240, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Key Resources', content: '- Resource 1\n- Resource 2\n- Resource 3\n\nIntellectual property:', position_x: 700, position_y: 80, width: 240, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Value Propositions', content: '- Value 1: Solves [problem]\n- Value 2: Addresses [need]\n- Value 3: Delivers [benefit]\n\nWhy us vs competitors:', position_x: 400, position_y: 320, width: 240, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Customer Relationships', content: '- Personal assistance\n- Self-service\n- Automated\n\nCommunity:', position_x: 700, position_y: 320, width: 240, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Channels', content: '- Online store\n- Social media\n- Direct sales\n- Partners', position_x: 1000, position_y: 80, width: 240, height: 160, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Customer Segments', content: '- Segment 1: [Description]\n- Segment 2: [Description]\n- Segment 3: [Description]', position_x: 1000, position_y: 300, width: 240, height: 160, color: '#30d15820' },
      { type: 'sticky_note', title: 'Cost Structure', content: 'Fixed costs:\n- [Cost 1]\n- [Cost 2]\n\nVariable costs:\n- [Cost 3]', position_x: 100, position_y: 340, width: 240, height: 180, color: '#ffd60a20' },
      { type: 'sticky_note', title: 'Revenue Streams', content: 'Stream 1: $[Amount]\nStream 2: $[Amount]\nStream 3: $[Amount]\n\nPricing model:', position_x: 700, position_y: 560, width: 240, height: 180, color: '#34c75920' }
    ]
  },
  {
    id: 'meeting-notes',
    category: 'business',
    name: 'Meeting Notes',
    description: 'Document meeting agenda, discussions, and action items.',
    items: [
      { type: 'rich_note', title: 'Meeting Details', content: 'Title: [Meeting Title]\nDate: [Date]\nTime: [Start - End]\nLocation: [Room/Link]\nAttendees: [Names]', position_x: 100, position_y: 80, width: 340, height: 160, color: '#007aff20' },
      { type: 'rich_note', title: 'Agenda', content: '1. Opening remarks (5 min)\n2. Topic 1 discussion (15 min)\n3. Topic 2 discussion (15 min)\n4. Decisions needed (10 min)\n5. Action items (5 min)\n6. Next steps (5 min)', position_x: 100, position_y: 300, width: 340, height: 200, color: '#ffffff' },
      { type: 'sticky_note', title: 'Discussion Notes', content: 'Topic 1:\n- Point discussed\n- Counterpoint raised\n- Resolution\n\nTopic 2:\n- Point discussed\n- Decision made', position_x: 500, position_y: 80, width: 320, height: 240, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Decisions Made', content: '1. Decision 1: [Details]\n   Approved by: [Names]\n\n2. Decision 2: [Details]\n   Approved by: [Names]', position_x: 500, position_y: 380, width: 320, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Action Items', content: '- [ ] Task 1 → Owner: [Name] Due: [Date]\n- [ ] Task 2 → Owner: [Name] Due: [Date]\n- [ ] Task 3 → Owner: [Name] Due: [Date]', position_x: 880, position_y: 80, width: 320, height: 180, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Next Meeting', content: 'Date: [Date]\nTime: [Time]\nLocation: [Room/Link]\n\nPre-read materials:\n- [Document 1]\n- [Document 2]', position_x: 880, position_y: 320, width: 320, height: 180, color: '#af52de20' }
    ]
  },
  {
    id: 'project-plan',
    category: 'business',
    name: 'Project Plan',
    description: 'Plan project phases, milestones, and deliverables.',
    items: [
      { type: 'rich_note', title: 'Project Overview', content: 'Project: [Name]\nManager: [Name]\nStart: [Date]\nEnd: [Date]\nBudget: $[Amount]\n\nObjective:', position_x: 100, position_y: 80, width: 300, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Phase 1: Planning', content: 'Duration: [X weeks]\n\nDeliverables:\n- [Deliverable 1]\n- [Deliverable 2]\n\nStatus: [ ] Not started', position_x: 100, position_y: 320, width: 260, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Phase 2: Development', content: 'Duration: [X weeks]\n\nDeliverables:\n- [Deliverable 1]\n- [Deliverable 2]\n\nStatus: [ ] Not started', position_x: 420, position_y: 320, width: 260, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Phase 3: Testing', content: 'Duration: [X weeks]\n\nDeliverables:\n- [Deliverable 1]\n- [Deliverable 2]\n\nStatus: [ ] Not started', position_x: 740, position_y: 320, width: 260, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Phase 4: Launch', content: 'Duration: [X weeks]\n\nDeliverables:\n- [Deliverable 1]\n- [Deliverable 2]\n\nStatus: [ ] Not started', position_x: 1060, position_y: 320, width: 260, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Key Milestones', content: '1. Project kickoff - [Date]\n2. Design approval - [Date]\n3. MVP ready - [Date]\n4. Beta release - [Date]\n5. Final launch - [Date]', position_x: 460, position_y: 80, width: 300, height: 180, color: '#ffd60a20' },
      { type: 'sticky_note', title: 'Risks & Dependencies', content: 'Risks:\n- [Risk 1]\n- [Risk 2]\n\nDependencies:\n- [Dependency 1]\n- [Dependency 2]', position_x: 820, position_y: 80, width: 300, height: 180, color: '#ff3b3020' }
    ]
  },
  {
    id: 'okr',
    category: 'business',
    name: 'OKR Tracker',
    description: 'Track Objectives and Key Results for quarterly planning.',
    items: [
      { type: 'rich_note', title: 'Objective 1', content: 'Goal: [Objective description]\n\nKey Results:\n- KR1: [Metric] from X to Y\n- KR2: [Metric] from X to Y\n- KR3: [Metric] from X to Y\n\nProgress: 25%', position_x: 100, position_y: 80, width: 340, height: 200, color: '#007aff20' },
      { type: 'sticky_note', title: 'Objective 2', content: 'Goal: [Objective description]\n\nKey Results:\n- KR1: [Metric] from X to Y\n- KR2: [Metric] from X to Y\n- KR3: [Metric] from X to Y\n\nProgress: 10%', position_x: 500, position_y: 80, width: 340, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Objective 3', content: 'Goal: [Objective description]\n\nKey Results:\n- KR1: [Metric] from X to Y\n- KR2: [Metric] from X to Y\n- KR3: [Metric] from X to Y\n\nProgress: 40%', position_x: 900, position_y: 80, width: 340, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Quarter Summary', content: 'Overall progress: 25%\n\nAhead of schedule: 1\nOn track: 1\nAt risk: 1\n\nReview date: [Date]', position_x: 100, position_y: 340, width: 300, height: 160, color: '#af52de20' },
      { type: 'sticky_note', title: 'Support Needed', content: 'For O1:\n- [Resource 1]\n- [Resource 2]\n\nFor O2:\n- [Resource 1]\n\nFor O3:\n- [Resource 1]', position_x: 460, position_y: 340, width: 300, height: 160, color: '#ff648220' },
      { type: 'sticky_note', title: 'Check-in Notes', content: 'Week 4:\n- [Observation]\n- [Adjustment]\n\nWeek 8:\n- [Observation]\n- [Adjustment]', position_x: 820, position_y: 340, width: 300, height: 160, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'sprint',
    category: 'business',
    name: 'Sprint Planning',
    description: 'Plan and track agile sprints with user stories and tasks.',
    items: [
      { type: 'rich_note', title: 'Sprint Info', content: 'Sprint: [Number]\nGoal: [Sprint goal]\nStart: [Date]\nEnd: [Date]\nTeam: [Members]\nCapacity: [X] story points', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Sprint Backlog', content: 'Story 1: [Description]\n  Points: 3\n  Assignee: [Name]\n\nStory 2: [Description]\n  Points: 5\n  Assignee: [Name]\n\nStory 3: [Description]\n  Points: 2\n  Assignee: [Name]', position_x: 100, position_y: 300, width: 300, height: 240, color: '#34c75920' },
      { type: 'sticky_note', title: 'To Do', content: '- Story 1\n- Story 2\n- Story 3\n- Bug fix: [Description]', position_x: 460, position_y: 80, width: 240, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'In Progress', content: '- Story 4\n  Assignee: [Name]\n  Status: Development\n\n- Story 5\n  Assignee: [Name]\n  Status: Review', position_x: 460, position_y: 320, width: 240, height: 180, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Done', content: '- Story 6: Completed\n- Story 7: Completed\n\nVelocity: 13 points\nStories completed: 2', position_x: 760, position_y: 80, width: 240, height: 180, color: '#30d15820' },
      { type: 'sticky_note', title: 'Blockers', content: '1. [Blocker description]\n   Owner: [Name]\n   Status: Open\n\n2. [Blocker description]\n   Owner: [Name]\n   Status: Resolved', position_x: 760, position_y: 320, width: 240, height: 180, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Retrospective Notes', content: 'What went well:\n- [Item]\n\nWhat to improve:\n- [Item]\n\nAction items:\n- [Item]', position_x: 1060, position_y: 80, width: 260, height: 200, color: '#af52de20' }
    ]
  },

  // ── Creative & Design ────────────────────────────────────────────────
  {
    id: 'mind-map',
    category: 'creative',
    name: 'Mind Map',
    description: 'Visual brainstorming tool for organizing ideas hierarchically.',
    items: [
      { type: 'rich_note', title: 'Central Idea', content: '[Your main concept here]\n\nThis is the core topic\nfrom which all branches\noriginate.', position_x: 500, position_y: 250, width: 280, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Branch 1', content: 'Subtopic 1.1\nSubtopic 1.2\nSubtopic 1.3', position_x: 100, position_y: 80, width: 220, height: 140, color: '#34c75920' },
      { type: 'sticky_note', title: 'Branch 2', content: 'Subtopic 2.1\nSubtopic 2.2\nSubtopic 2.3', position_x: 100, position_y: 280, width: 220, height: 140, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Branch 3', content: 'Subtopic 3.1\nSubtopic 3.2\nSubtopic 3.3', position_x: 100, position_y: 480, width: 220, height: 140, color: '#af52de20' },
      { type: 'sticky_note', title: 'Branch 4', content: 'Subtopic 4.1\nSubtopic 4.2\nSubtopic 4.3', position_x: 840, position_y: 80, width: 220, height: 140, color: '#ff648220' },
      { type: 'sticky_note', title: 'Branch 5', content: 'Subtopic 5.1\nSubtopic 5.2\nSubtopic 5.3', position_x: 840, position_y: 280, width: 220, height: 140, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Branch 6', content: 'Subtopic 6.1\nSubtopic 6.2\nSubtopic 6.3', position_x: 840, position_y: 480, width: 220, height: 140, color: '#30d15820' }
    ]
  },
  {
    id: 'mood-board',
    category: 'creative',
    name: 'Mood Board',
    description: 'Collect visual inspiration, colors, and references for projects.',
    items: [
      { type: 'rich_note', title: 'Project Brief', content: 'Project: [Name]\nClient: [Client]\nDeadline: [Date]\n\nMood: [Adjectives]\nTarget audience: [Description]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Color Palette', content: 'Primary: #1a1a2e\nSecondary: #16213e\nAccent: #0f3460\nHighlight: #e94560\nNeutral: #f5f5f5', position_x: 460, position_y: 80, width: 260, height: 180, color: '#ffffff' },
      { type: 'sticky_note', title: 'Typography', content: 'Headings: [Font Name]\nBody: [Font Name]\nAccent: [Font Name]\n\nWeights: Light, Regular, Bold\nSizes: 12px, 16px, 24px, 48px', position_x: 780, position_y: 80, width: 260, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Visual References', content: 'Image 1: [Description]\nImage 2: [Description]\nImage 3: [Description]\nImage 4: [Description]\nImage 5: [Description]', position_x: 100, position_y: 300, width: 300, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Textures & Patterns', content: '- Gradient overlays\n- Geometric patterns\n- Organic shapes\n- Noise texture\n- Glassmorphism', position_x: 460, position_y: 320, width: 260, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Inspirational Quotes', content: '"[Relevant quote 1]"\n\n"[Relevant quote 2]"\n\n"[Relevant quote 3]"', position_x: 780, position_y: 320, width: 260, height: 180, color: '#ffd60a20' }
    ]
  },
  {
    id: 'storyboard',
    category: 'creative',
    name: 'Storyboard',
    description: 'Plan visual narratives with frames, descriptions, and timing.',
    items: [
      { type: 'rich_note', title: 'Project Overview', content: 'Title: [Story Title]\nFormat: [Film/Ad/Animation]\nDuration: [X minutes]\nTarget audience: [Description]', position_x: 100, position_y: 80, width: 300, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Scene 1', content: 'Time: 00:00 - 00:15\n\nVisual: [Description]\nAction: [What happens]\nDialogue: [If any]\nMusic: [Mood]', position_x: 100, position_y: 280, width: 260, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Scene 2', content: 'Time: 00:15 - 00:30\n\nVisual: [Description]\nAction: [What happens]\nDialogue: [If any]\nMusic: [Mood]', position_x: 420, position_y: 280, width: 260, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Scene 3', content: 'Time: 00:30 - 00:45\n\nVisual: [Description]\nAction: [What happens]\nDialogue: [If any]\nMusic: [Mood]', position_x: 740, position_y: 280, width: 260, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Scene 4', content: 'Time: 00:45 - 01:00\n\nVisual: [Description]\nAction: [What happens]\nDialogue: [If any]\nMusic: [Mood]', position_x: 1060, position_y: 280, width: 260, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Key Notes', content: 'Color grading: [Style]\nTransitions: [Types]\nSpecial effects: [List]\n\nProps needed:\n- [Prop 1]\n- [Prop 2]', position_x: 460, position_y: 540, width: 300, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'design-system',
    category: 'creative',
    name: 'Design System',
    description: 'Document design tokens, components, and guidelines.',
    items: [
      { type: 'rich_note', title: 'Brand Identity', content: 'Brand: [Name]\nTagline: [Tagline]\nVoice: [Tone description]\n\nPrimary color: [Hex]\nSecondary color: [Hex]\nAccent: [Hex]', position_x: 100, position_y: 80, width: 320, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Typography Scale', content: 'H1: 48px / Bold\nH2: 36px / Bold\nH3: 28px / SemiBold\nH4: 24px / SemiBold\nBody: 16px / Regular\nSmall: 14px / Regular', position_x: 480, position_y: 80, width: 260, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Spacing System', content: '4px - xs\n8px - sm\n12px - md\n16px - lg\n24px - xl\n32px - 2xl\n48px - 3xl', position_x: 800, position_y: 80, width: 220, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Buttons', content: 'Primary: [Style]\nSecondary: [Style]\nOutline: [Style]\nGhost: [Style]\n\nStates: Default, Hover, Active, Disabled', position_x: 100, position_y: 320, width: 280, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Cards', content: 'Default card:\n- Padding: 16px\n- Border radius: 8px\n- Shadow: [Value]\n\nElevated card:\n- Padding: 24px\n- Shadow: [Value]', position_x: 440, position_y: 320, width: 280, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Icons', content: 'Style: [Outlined/Filled]\nSize: 24px default\nStroke: 2px\n\nIcon library: [Name]\nTotal icons: [Number]', position_x: 780, position_y: 320, width: 260, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'user-journey',
    category: 'creative',
    name: 'User Journey Map',
    description: 'Map user experiences across touchpoints and emotions.',
    items: [
      { type: 'rich_note', title: 'Journey Overview', content: 'User persona: [Name]\nGoal: [What they want to achieve]\nContext: [Situation]\n\nTimeline: [X days/weeks]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Awareness', content: 'Touchpoints:\n- Social media ad\n- Word of mouth\n- Search engine\n\nThoughts: [What they think]\nFeelings: [Emotions]', position_x: 100, position_y: 300, width: 240, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Consideration', content: 'Touchpoints:\n- Website visit\n- Product demo\n- Reviews\n\nThoughts: [What they think]\nFeelings: [Emotions]', position_x: 400, position_y: 300, width: 240, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Purchase', content: 'Touchpoints:\n- Checkout page\n- Payment\n- Confirmation email\n\nThoughts: [What they think]\nFeelings: [Emotions]', position_x: 700, position_y: 300, width: 240, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Retention', content: 'Touchpoints:\n- Onboarding emails\n- Product usage\n- Support chat\n\nThoughts: [What they think]\nFeelings: [Emotions]', position_x: 1000, position_y: 300, width: 240, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Advocacy', content: 'Touchpoints:\n- Referral program\n- Social sharing\n- Reviews\n\nThoughts: [What they think]\nFeelings: [Emotions]', position_x: 1300, position_y: 300, width: 240, height: 200, color: '#30d15820' }
    ]
  },
  {
    id: 'brand-board',
    category: 'creative',
    name: 'Brand Board',
    description: 'Comprehensive brand guidelines and visual identity reference.',
    items: [
      { type: 'rich_note', title: 'Brand Overview', content: 'Brand: [Name]\nIndustry: [Industry]\nFounded: [Year]\nMission: [Mission statement]\nVision: [Vision statement]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Logo Usage', content: 'Primary logo: [Description]\nSecondary: [Description]\nIcon: [Description]\n\nMinimum size: [X]px\nClear space: [X]px\nDo: [Rules]\nDon\'t: [Rules]', position_x: 480, position_y: 80, width: 280, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Color System', content: 'Primary: #1a1a2e\nSecondary: #16213e\nAccent 1: #0f3460\nAccent 2: #e94560\nNeutral: #f5f5f5\n\nUsage: 60-30-10 rule', position_x: 820, position_y: 80, width: 260, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Brand Voice', content: 'Tone: [Adjectives]\nPersonality: [Traits]\n\nWe are: [Values]\nWe are not: [Anti-values]\n\nLanguage: [Guidelines]', position_x: 100, position_y: 300, width: 300, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Photography', content: 'Style: [Description]\nLighting: [Type]\nComposition: [Rules]\n\nSubjects: [Types]\nFilters: [If any]', position_x: 460, position_y: 340, width: 260, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Applications', content: 'Business cards\nLetterhead\nSocial media\nWebsite\nPackaging\nMerchandise', position_x: 780, position_y: 340, width: 260, height: 180, color: '#5ac8fa20' }
    ]
  },

  // ── Personal & Life ──────────────────────────────────────────────────
  {
    id: 'goal-setting',
    category: 'personal',
    name: 'Goal Setting',
    description: 'Define and track personal goals with milestones.',
    items: [
      { type: 'rich_note', title: 'Vision Statement', content: 'Where I want to be in 1 year:\n[Your vision]\n\nCore values:\n- [Value 1]\n- [Value 2]\n- [Value 3]', position_x: 100, position_y: 80, width: 340, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Goal 1: Career', content: 'Goal: [Specific goal]\nDeadline: [Date]\n\nMilestones:\n- [ ] Month 1: [Action]\n- [ ] Month 3: [Action]\n- [ ] Month 6: [Action]', position_x: 100, position_y: 320, width: 300, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Goal 2: Health', content: 'Goal: [Specific goal]\nDeadline: [Date]\n\nMilestones:\n- [ ] Month 1: [Action]\n- [ ] Month 3: [Action]\n- [ ] Month 6: [Action]', position_x: 460, position_y: 320, width: 300, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Goal 3: Finance', content: 'Goal: [Specific goal]\nDeadline: [Date]\n\nMilestones:\n- [ ] Month 1: [Action]\n- [ ] Month 3: [Action]\n- [ ] Month 6: [Action]', position_x: 820, position_y: 320, width: 300, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Goal 4: Learning', content: 'Goal: [Specific goal]\nDeadline: [Date]\n\nMilestones:\n- [ ] Month 1: [Action]\n- [ ] Month 3: [Action]\n- [ ] Month 6: [Action]', position_x: 100, position_y: 580, width: 300, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Accountability', content: 'Accountability partner: [Name]\nCheck-in frequency: [Weekly]\n\nRewards for milestones:\n- [Reward 1]\n- [Reward 2]\n- [Reward 3]', position_x: 460, position_y: 580, width: 300, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'weekly-planner',
    category: 'personal',
    name: 'Weekly Planner',
    description: 'Plan your week with priorities, appointments, and tasks.',
    items: [
      { type: 'rich_note', title: 'Week of', content: 'Date: [Start date] - [End date]\n\nTop priorities this week:\n1. [Priority 1]\n2. [Priority 2]\n3. [Priority 3]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Monday', content: 'Morning:\n- [Task]\n- [Task]\n\nAfternoon:\n- [Task]\n- [Task]\n\nEvening:\n- [Task]', position_x: 100, position_y: 300, width: 220, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Tuesday', content: 'Morning:\n- [Task]\n- [Task]\n\nAfternoon:\n- [Task]\n- [Task]\n\nEvening:\n- [Task]', position_x: 380, position_y: 300, width: 220, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Wednesday', content: 'Morning:\n- [Task]\n- [Task]\n\nAfternoon:\n- [Task]\n- [Task]\n\nEvening:\n- [Task]', position_x: 660, position_y: 300, width: 220, height: 220, color: '#af52de20' },
      { type: 'sticky_note', title: 'Thursday', content: 'Morning:\n- [Task]\n- [Task]\n\nAfternoon:\n- [Task]\n- [Task]\n\nEvening:\n- [Task]', position_x: 940, position_y: 300, width: 220, height: 220, color: '#ff648220' },
      { type: 'sticky_note', title: 'Friday', content: 'Morning:\n- [Task]\n- [Task]\n\nAfternoon:\n- [Task]\n- [Task]\n\nEvening:\n- [Task]', position_x: 1220, position_y: 300, width: 220, height: 220, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Weekend', content: 'Saturday:\n- [Task/Activity]\n- [Task/Activity]\n\nSunday:\n- [Task/Activity]\n- [Task/Activity]\n- Plan next week', position_x: 100, position_y: 580, width: 280, height: 180, color: '#30d15820' },
      { type: 'sticky_note', title: 'Notes & Reflections', content: 'What went well:\n- [Item]\n\nWhat to improve:\n- [Item]\n\nGratitude:\n- [Item]', position_x: 440, position_y: 580, width: 280, height: 180, color: '#ffd60a20' }
    ]
  },
  {
    id: 'vision-board',
    category: 'personal',
    name: 'Vision Board',
    description: 'Visualize your dreams and aspirations across life areas.',
    items: [
      { type: 'rich_note', title: 'My Vision', content: 'Theme: [Overall theme for the year]\nMantra: [Personal affirmation]\n\nI am creating a life that is:\n- [Quality 1]\n- [Quality 2]\n- [Quality 3]', position_x: 500, position_y: 80, width: 300, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Career', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 100, position_y: 80, width: 260, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Relationships', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 100, position_y: 320, width: 260, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Health', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 860, position_y: 80, width: 260, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Finance', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 860, position_y: 320, width: 260, height: 180, color: '#ffd60a20' },
      { type: 'sticky_note', title: 'Adventure', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 100, position_y: 560, width: 260, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Personal Growth', content: 'I will:\n- [Achievement 1]\n- [Achievement 2]\n- [Achievement 3]\n\nVisual: [Description of image]', position_x: 420, position_y: 560, width: 260, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'habit-tracker',
    category: 'personal',
    name: 'Habit Tracker',
    description: 'Build and track daily habits with streak monitoring.',
    items: [
      { type: 'rich_note', title: 'Habit Goals', content: 'Focus areas:\n1. Health & Fitness\n2. Productivity\n3. Mindfulness\n4. Learning\n5. Social\n\nStart date: [Date]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Morning Routine', content: 'Wake up at [Time]\n- [ ] Meditation (10 min)\n- [ ] Exercise (30 min)\n- [ ] Healthy breakfast\n- [ ] Journal (5 min)\n- [ ] Review goals', position_x: 100, position_y: 300, width: 260, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Work Habits', content: '- [ ] Deep work (2 hours)\n- [ ] No phone during focus\n- [ ] Take breaks every 90 min\n- [ ] Review priorities\n- [ ] Plan tomorrow', position_x: 420, position_y: 300, width: 260, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Evening Routine', content: '- [ ] Exercise (30 min)\n- [ ] Read (20 min)\n- [ ] Prep for tomorrow\n- [ ] Screen off by [Time]\n- [ ] Sleep by [Time]', position_x: 740, position_y: 300, width: 260, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Weekly Review', content: 'Every Sunday:\n- Review habit streaks\n- Celebrate wins\n- Identify patterns\n- Adjust goals\n- Plan next week', position_x: 1060, position_y: 300, width: 260, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Streak Tracker', content: 'Current best streak: [X] days\n\nHabit 1: [X] days\nHabit 2: [X] days\nHabit 3: [X] days\nHabit 4: [X] days\nHabit 5: [X] days', position_x: 420, position_y: 560, width: 300, height: 180, color: '#ffd60a20' }
    ]
  },
  {
    id: 'journal',
    category: 'personal',
    name: 'Journal',
    description: 'Daily journaling with prompts for reflection and gratitude.',
    items: [
      { type: 'rich_note', title: 'Today\'s Entry', content: 'Date: [Date]\nMood: [How you feel]\nEnergy level: [1-10]\n\nToday I am grateful for:', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Gratitude', content: '1. [Something you\'re grateful for]\n2. [Something you\'re grateful for]\n3. [Something you\'re grateful for]\n\nWhy these matter:', position_x: 100, position_y: 300, width: 300, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Daily Highlights', content: 'Best moment:\n[Description]\n\nAccomplishment:\n[What you achieved]\n\nLesson learned:\n[What you learned]', position_x: 460, position_y: 80, width: 300, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Challenges', content: 'Challenge faced:\n[Description]\n\nHow I handled it:\n[Response]\n\nWhat I\'d do differently:\n[Reflection]', position_x: 460, position_y: 340, width: 300, height: 200, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Tomorrow\'s Intentions', content: 'Top priorities:\n1. [Priority]\n2. [Priority]\n3. [Priority]\n\nHow I want to feel:\n[Emotion]', position_x: 820, position_y: 80, width: 300, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Reflection Prompt', content: 'Prompt: [Weekly prompt]\n\nResponse:\n[Your thoughts]\n\nDeeper insight:\n[What this reveals]', position_x: 820, position_y: 320, width: 300, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'reading-list',
    category: 'personal',
    name: 'Reading List',
    description: 'Track books to read, currently reading, and completed.',
    items: [
      { type: 'rich_note', title: 'Reading Goals', content: 'Goal: [X] books this year\nCompleted: [X] books\nCurrently reading: [X] books\n\nGenres to explore:\n- [Genre 1]\n- [Genre 2]', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Currently Reading', content: '1. [Book Title]\n   Author: [Name]\n   Progress: [X]%\n   Started: [Date]\n\n2. [Book Title]\n   Author: [Name]\n   Progress: [X]%\n   Started: [Date]', position_x: 100, position_y: 300, width: 300, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'To Read Next', content: '- [Book 1] by [Author]\n- [Book 2] by [Author]\n- [Book 3] by [Author]\n- [Book 4] by [Author]\n- [Book 5] by [Author]\n- [Book 6] by [Author]', position_x: 460, position_y: 80, width: 280, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Completed This Year', content: '- [Book 1] ⭐⭐⭐⭐⭐\n- [Book 2] ⭐⭐⭐⭐\n- [Book 3] ⭐⭐⭐⭐⭐\n- [Book 4] ⭐⭐⭐\n- [Book 5] ⭐⭐⭐⭐', position_x: 460, position_y: 360, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Book Notes', content: 'Key insights:\n- [Insight 1]\n- [Insight 2]\n- [Insight 3]\n\nFavorite quote:\n"[Quote]"', position_x: 800, position_y: 80, width: 300, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Recommendations', content: 'From friends:\n- [Book] - recommended by [Name]\n\nFrom articles:\n- [Book] - from [Source]\n\nAward winners:\n- [Book] - [Award]', position_x: 800, position_y: 340, width: 300, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'travel-planner',
    category: 'personal',
    name: 'Travel Planner',
    description: 'Plan trips with itineraries, packing lists, and budgets.',
    items: [
      { type: 'rich_note', title: 'Trip Overview', content: 'Destination: [Place]\nDates: [Start] - [End]\nTravelers: [Names]\nBudget: $[Amount]\n\nPurpose: [Leisure/Business/Both]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Day 1', content: 'Morning:\n- [Activity]\n- [Activity]\n\nAfternoon:\n- [Activity]\n- [Activity]\n\nEvening:\n- [Activity]\n- [Dinner spot]', position_x: 100, position_y: 300, width: 260, height: 240, color: '#34c75920' },
      { type: 'sticky_note', title: 'Day 2', content: 'Morning:\n- [Activity]\n- [Activity]\n\nAfternoon:\n- [Activity]\n- [Activity]\n\nEvening:\n- [Activity]\n- [Dinner spot]', position_x: 420, position_y: 300, width: 260, height: 240, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Day 3', content: 'Morning:\n- [Activity]\n- [Activity]\n\nAfternoon:\n- [Activity]\n- [Activity]\n\nEvening:\n- [Activity]\n- [Dinner spot]', position_x: 740, position_y: 300, width: 260, height: 240, color: '#af52de20' },
      { type: 'sticky_note', title: 'Packing List', content: 'Essentials:\n- [ ] Passport\n- [ ] Tickets\n- [ ] Cash/Card\n\nClothing:\n- [ ] Items\n\nToiletries:\n- [ ] Items', position_x: 1060, position_y: 80, width: 260, height: 240, color: '#ff648220' },
      { type: 'sticky_note', title: 'Budget', content: 'Flights: $[Amount]\nHotel: $[Amount]\nFood: $[Amount]\nActivities: $[Amount]\nTransport: $[Amount]\nShopping: $[Amount]\n\nTotal: $[Amount]', position_x: 1060, position_y: 380, width: 260, height: 200, color: '#ffd60a20' }
    ]
  },

  // ── Business Operations ──────────────────────────────────────────────
  {
    id: 'roadmap',
    category: 'ops',
    name: 'Product Roadmap',
    description: 'Plan product development phases and feature releases.',
    items: [
      { type: 'rich_note', title: 'Roadmap Overview', content: 'Product: [Name]\nVision: [Statement]\nTimeline: [Q1-Q4]\nTeam: [Size]\n\nStrategic themes:\n1. [Theme 1]\n2. [Theme 2]\n3. [Theme 3]', position_x: 100, position_y: 80, width: 340, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Q1: Foundation', content: 'Focus: [Theme]\n\nKey features:\n- Feature 1: [Description]\n- Feature 2: [Description]\n- Feature 3: [Description]\n\nMilestone: [Date]', position_x: 100, position_y: 320, width: 280, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Q2: Growth', content: 'Focus: [Theme]\n\nKey features:\n- Feature 4: [Description]\n- Feature 5: [Description]\n- Feature 6: [Description]\n\nMilestone: [Date]', position_x: 440, position_y: 320, width: 280, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Q3: Scale', content: 'Focus: [Theme]\n\nKey features:\n- Feature 7: [Description]\n- Feature 8: [Description]\n- Feature 9: [Description]\n\nMilestone: [Date]', position_x: 780, position_y: 320, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Q4: Optimize', content: 'Focus: [Theme]\n\nKey features:\n- Feature 10: [Description]\n- Feature 11: [Description]\n- Feature 12: [Description]\n\nMilestone: [Date]', position_x: 1120, position_y: 320, width: 280, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Dependencies', content: 'External:\n- [Dependency 1]\n- [Dependency 2]\n\nInternal:\n- [Dependency 3]\n- [Dependency 4]\n\nRisks:\n- [Risk 1]', position_x: 500, position_y: 580, width: 300, height: 180, color: '#ff3b3020' }
    ]
  },
  {
    id: 'retro',
    category: 'ops',
    name: 'Retrospective',
    description: 'Conduct team retrospectives with structured feedback.',
    items: [
      { type: 'rich_note', title: 'Retrospective Details', content: 'Sprint/Period: [Number/Dates]\nFacilitator: [Name]\nDate: [Date]\nParticipants: [Names]\n\nDuration: [X] minutes', position_x: 100, position_y: 80, width: 320, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'What went well', content: '+ [Success 1]\n+ [Success 2]\n+ [Success 3]\n+ [Success 4]\n+ [Success 5]', position_x: 100, position_y: 280, width: 300, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'What didn\'t go well', content: '- [Issue 1]\n- [Issue 2]\n- [Issue 3]\n- [Issue 4]\n- [Issue 5]', position_x: 460, position_y: 280, width: 300, height: 220, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Ideas for improvement', content: '1. [Idea 1]\n2. [Idea 2]\n3. [Idea 3]\n4. [Idea 4]\n5. [Idea 5]', position_x: 820, position_y: 280, width: 300, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Action Items', content: '- [ ] Action 1 → Owner: [Name]\n- [ ] Action 2 → Owner: [Name]\n- [ ] Action 3 → Owner: [Name]\n- [ ] Action 4 → Owner: [Name]\n- [ ] Action 5 → Owner: [Name]', position_x: 100, position_y: 560, width: 340, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Shoutouts', content: 'Great work by:\n- [Name] for [Contribution]\n- [Name] for [Contribution]\n- [Name] for [Contribution]', position_x: 500, position_y: 560, width: 300, height: 160, color: '#ffd60a20' }
    ]
  },
  {
    id: 'risk-assessment',
    category: 'ops',
    name: 'Risk Assessment',
    description: 'Identify, evaluate, and plan mitigation for project risks.',
    items: [
      { type: 'rich_note', title: 'Assessment Overview', content: 'Project: [Name]\nAssessed by: [Name]\nDate: [Date]\nReview cycle: [Weekly/Monthly]\n\nRisk tolerance: [Low/Medium/High]', position_x: 100, position_y: 80, width: 320, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'High Risk', content: 'Risk 1: [Description]\n  Impact: High\n  Probability: High\n  Mitigation: [Strategy]\n\nRisk 2: [Description]\n  Impact: High\n  Probability: Medium\n  Mitigation: [Strategy]', position_x: 100, position_y: 280, width: 320, height: 220, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Medium Risk', content: 'Risk 3: [Description]\n  Impact: Medium\n  Probability: Medium\n  Mitigation: [Strategy]\n\nRisk 4: [Description]\n  Impact: Medium\n  Probability: Low\n  Mitigation: [Strategy]', position_x: 480, position_y: 280, width: 320, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Low Risk', content: 'Risk 5: [Description]\n  Impact: Low\n  Probability: Low\n  Mitigation: Monitor\n\nRisk 6: [Description]\n  Impact: Low\n  Probability: Medium\n  Mitigation: [Strategy]', position_x: 860, position_y: 280, width: 320, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Risk Register', content: 'ID | Risk | Owner | Status\nR1 | [Name] | [Owner] | Open\nR2 | [Name] | [Owner] | Mitigating\nR3 | [Name] | [Owner] | Closed\nR4 | [Name] | [Owner] | Open', position_x: 100, position_y: 560, width: 380, height: 160, color: '#af52de20' },
      { type: 'sticky_note', title: 'Contingency Plans', content: 'If Risk 1 occurs:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nIf Risk 2 occurs:\n1. [Step 1]\n2. [Step 2]', position_x: 540, position_y: 560, width: 320, height: 160, color: '#ff648220' }
    ]
  },
  {
    id: 'stakeholder-map',
    category: 'ops',
    name: 'Stakeholder Map',
    description: 'Identify and categorize project stakeholders and their interests.',
    items: [
      { type: 'rich_note', title: 'Project Context', content: 'Project: [Name]\nSponsor: [Name]\nPM: [Name]\n\nObjective: [Statement]\nTimeline: [Dates]\nBudget: $[Amount]', position_x: 100, position_y: 80, width: 300, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Key Players', content: '[Name] - [Role]\n  Interest: High\n  Influence: High\n  Strategy: Manage closely\n\n[Name] - [Role]\n  Interest: High\n  Influence: High\n  Strategy: Manage closely', position_x: 100, position_y: 280, width: 300, height: 220, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Keep Satisfied', content: '[Name] - [Role]\n  Interest: Low\n  Influence: High\n  Strategy: Keep satisfied\n\n[Name] - [Role]\n  Interest: Low\n  Influence: High\n  Strategy: Keep satisfied', position_x: 460, position_y: 280, width: 300, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Keep Informed', content: '[Name] - [Role]\n  Interest: High\n  Influence: Low\n  Strategy: Keep informed\n\n[Name] - [Role]\n  Interest: High\n  Influence: Low\n  Strategy: Keep informed', position_x: 820, position_y: 280, width: 300, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Monitor', content: '[Name] - [Role]\n  Interest: Low\n  Influence: Low\n  Strategy: Monitor\n\n[Name] - [Role]\n  Interest: Low\n  Influence: Low\n  Strategy: Monitor', position_x: 1180, position_y: 280, width: 300, height: 220, color: '#af52de20' },
      { type: 'sticky_note', title: 'Communication Plan', content: 'Audience | Channel | Frequency\nKey Players | Meeting | Weekly\nKeep Satisfied | Email | Bi-weekly\nKeep Informed | Newsletter | Monthly\nMonitor | Reports | As needed', position_x: 460, position_y: 560, width: 380, height: 160, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'budget',
    category: 'ops',
    name: 'Budget Planner',
    description: 'Track project or department budgets with allocations.',
    items: [
      { type: 'rich_note', title: 'Budget Overview', content: 'Project/Dept: [Name]\nPeriod: [Quarter/Year]\nTotal budget: $[Amount]\nSpent: $[Amount]\nRemaining: $[Amount]\n\nApproval status: [Status]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Personnel', content: 'Allocated: $[Amount]\n\n- Salary: $[Amount]\n- Benefits: $[Amount]\n- Training: $[Amount]\n- Contractors: $[Amount]\n\nUtilization: [X]%', position_x: 100, position_y: 300, width: 280, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Technology', content: 'Allocated: $[Amount]\n\n- Software: $[Amount]\n- Hardware: $[Amount]\n- Cloud services: $[Amount]\n- Licenses: $[Amount]\n\nUtilization: [X]%', position_x: 440, position_y: 300, width: 280, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Operations', content: 'Allocated: $[Amount]\n\n- Office space: $[Amount]\n- Supplies: $[Amount]\n- Travel: $[Amount]\n- Marketing: $[Amount]\n\nUtilization: [X]%', position_x: 780, position_y: 300, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Contingency', content: 'Allocated: $[Amount]\n\nReserved for:\n- [Risk 1]: $[Amount]\n- [Risk 2]: $[Amount]\n- [Risk 3]: $[Amount]\n\nAvailable: $[Amount]', position_x: 1120, position_y: 300, width: 280, height: 200, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Variance Report', content: 'Category | Budget | Actual | Variance\nPersonnel | $X | $X | [+/-]\nTechnology | $X | $X | [+/-]\nOperations | $X | $X | [+/-]\n\nTotal variance: [+/-]', position_x: 100, position_y: 560, width: 360, height: 160, color: '#ffd60a20' }
    ]
  },
  {
    id: 'competitor',
    category: 'ops',
    name: 'Competitor Analysis',
    description: 'Analyze competitor strengths, weaknesses, and positioning.',
    items: [
      { type: 'rich_note', title: 'Market Overview', content: 'Market: [Industry/Segment]\nOur position: [Rank]\nMarket size: $[Amount]\nGrowth rate: [X]%\n\nKey trends:\n1. [Trend 1]\n2. [Trend 2]\n3. [Trend 3]', position_x: 100, position_y: 80, width: 320, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Competitor 1', content: 'Company: [Name]\nMarket share: [X]%\n\nStrengths:\n+ [Strength 1]\n+ [Strength 2]\n\nWeaknesses:\n- [Weakness 1]\n- [Weakness 2]', position_x: 100, position_y: 320, width: 280, height: 220, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Competitor 2', content: 'Company: [Name]\nMarket share: [X]%\n\nStrengths:\n+ [Strength 1]\n+ [Strength 2]\n\nWeaknesses:\n- [Weakness 1]\n- [Weakness 2]', position_x: 440, position_y: 320, width: 280, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Competitor 3', content: 'Company: [Name]\nMarket share: [X]%\n\nStrengths:\n+ [Strength 1]\n+ [Strength 2]\n\nWeaknesses:\n- [Weakness 1]\n- [Weakness 2]', position_x: 780, position_y: 320, width: 280, height: 220, color: '#af52de20' },
      { type: 'sticky_note', title: 'Comparison Matrix', content: 'Feature | Us | Comp1 | Comp2 | Comp3\nFeature 1 | Yes | Yes | No | Yes\nFeature 2 | Yes | No | Yes | No\nFeature 3 | No | Yes | Yes | Yes\nFeature 4 | Yes | Yes | Yes | No', position_x: 1120, position_y: 80, width: 300, height: 180, color: '#5ac8fa20' },
      { type: 'sticky_note', title: 'Strategic Opportunities', content: 'Gaps in market:\n- [Gap 1]\n- [Gap 2]\n\nOur advantages:\n- [Advantage 1]\n- [Advantage 2]\n\nThreats to monitor:\n- [Threat 1]', position_x: 1120, position_y: 320, width: 300, height: 200, color: '#34c75920' }
    ]
  },

  // ── Health & Wellness ────────────────────────────────────────────────
  {
    id: 'fitness',
    category: 'health',
    name: 'Fitness Tracker',
    description: 'Track workouts, progress, and fitness goals.',
    items: [
      { type: 'rich_note', title: 'Fitness Goals', content: 'Primary goal: [Goal]\nTarget date: [Date]\nCurrent weight: [X] lbs\nTarget weight: [X] lbs\n\nMetrics to track:\n- Weight\n- Body fat %\n- Strength gains', position_x: 100, position_y: 80, width: 320, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Weekly Schedule', content: 'Monday: Chest & Triceps\nTuesday: Back & Biceps\nWednesday: Rest / Cardio\nThursday: Legs & Shoulders\nFriday: Full Body\nSaturday: Active Recovery\nSunday: Rest', position_x: 100, position_y: 320, width: 280, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Workout Log', content: 'Date: [Date]\nWorkout: [Type]\nDuration: [X] min\n\nExercises:\n1. [Exercise] - [Sets x Reps x Weight]\n2. [Exercise] - [Sets x Reps x Weight]\n3. [Exercise] - [Sets x Reps x Weight]', position_x: 440, position_y: 80, width: 320, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Personal Records', content: 'Bench Press: [X] lbs\nSquat: [X] lbs\nDeadlift: [X] lbs\nMile time: [X]:[XX]\nPull-ups: [X] reps\n\nLast updated: [Date]', position_x: 440, position_y: 360, width: 300, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Nutrition', content: 'Daily calories: [X]\nProtein: [X]g\nCarbs: [X]g\nFat: [X]g\n\nWater: [X] glasses\n\nMeal plan:', position_x: 820, position_y: 80, width: 280, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Progress Photos', content: 'Week 1: [Date]\nWeek 4: [Date]\nWeek 8: [Date]\nWeek 12: [Date]\n\nNotes:\n[Observations about changes]', position_x: 820, position_y: 320, width: 280, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'meal-planner',
    category: 'health',
    name: 'Meal Planner',
    description: 'Plan weekly meals with recipes and grocery lists.',
    items: [
      { type: 'rich_note', title: 'Weekly Meal Plan', content: 'Week of: [Date]\nDietary restrictions: [None/List]\nBudget: $[Amount]\nServings: [Number]\n\nPrep day: [Day]', position_x: 100, position_y: 80, width: 300, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Monday', content: 'Breakfast: [Meal]\nLunch: [Meal]\nDinner: [Meal]\nSnacks: [Snack]\n\nPrep needed: [Yes/No]', position_x: 100, position_y: 280, width: 240, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Tuesday', content: 'Breakfast: [Meal]\nLunch: [Meal]\nDinner: [Meal]\nSnacks: [Snack]\n\nPrep needed: [Yes/No]', position_x: 400, position_y: 280, width: 240, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Wednesday', content: 'Breakfast: [Meal]\nLunch: [Meal]\nDinner: [Meal]\nSnacks: [Snack]\n\nPrep needed: [Yes/No]', position_x: 700, position_y: 280, width: 240, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Thursday', content: 'Breakfast: [Meal]\nLunch: [Meal]\nDinner: [Meal]\nSnacks: [Snack]\n\nPrep needed: [Yes/No]', position_x: 1000, position_y: 280, width: 240, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Grocery List', content: 'Produce:\n- [Item]\n- [Item]\n\nProtein:\n- [Item]\n- [Item]\n\nDairy:\n- [Item]\n\nPantry:\n- [Item]', position_x: 100, position_y: 520, width: 280, height: 220, color: '#30d15820' },
      { type: 'sticky_note', title: 'Recipe Notes', content: 'Recipe 1: [Name]\n  Prep: [X] min\n  Cook: [X] min\n  Servings: [X]\n\nRecipe 2: [Name]\n  Prep: [X] min\n  Cook: [X] min\n  Servings: [X]', position_x: 440, position_y: 520, width: 280, height: 220, color: '#ffd60a20' }
    ]
  },
  {
    id: 'mental-health',
    category: 'health',
    name: 'Mental Health Journal',
    description: 'Track mood, stress levels, and self-care activities.',
    items: [
      { type: 'rich_note', title: 'Check-in', content: 'Date: [Date]\nMood: [1-10]\nEnergy: [1-10]\nAnxiety level: [1-10]\nSleep quality: [1-10]\n\nOverall feeling:', position_x: 100, position_y: 80, width: 300, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Mood Tracker', content: 'Today I feel:\n- [Emotion 1]\n- [Emotion 2]\n- [Emotion 3]\n\nTriggers:\n- [Trigger 1]\n- [Trigger 2]\n\nCoping strategies used:\n- [Strategy 1]', position_x: 100, position_y: 300, width: 300, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Self-Care Activities', content: 'Completed today:\n- [ ] Exercise\n- [ ] Meditation\n- [ ] Healthy eating\n- [ ] Social connection\n- [ ] Creative activity\n- [ ] Rest/relaxation\n\nTime spent: [X] min', position_x: 460, position_y: 80, width: 280, height: 220, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Thoughts & Reflections', content: 'What\'s on my mind:\n[Write freely]\n\nGratitude:\n1. [Thing]\n2. [Thing]\n3. [Thing]\n\nAffirmation:\n[Affirmation]', position_x: 460, position_y: 360, width: 300, height: 220, color: '#af52de20' },
      { type: 'sticky_note', title: 'Weekly Patterns', content: 'Best days: [Days]\nWorst days: [Days]\n\nCommon triggers:\n- [Trigger 1]\n- [Trigger 2]\n\nEffective strategies:\n- [Strategy 1]\n- [Strategy 2]', position_x: 820, position_y: 80, width: 280, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Support Network', content: 'People I can talk to:\n- [Name] - [Relationship]\n- [Name] - [Relationship]\n\nProfessional support:\n- Therapist: [Name]\n- Doctor: [Name]\n\nHotlines:\n- [Resource 1]', position_x: 820, position_y: 340, width: 280, height: 200, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'health-tracker',
    category: 'health',
    name: 'Health Tracker',
    description: 'Monitor vital signs, symptoms, and overall health metrics.',
    items: [
      { type: 'rich_note', title: 'Health Profile', content: 'Name: [Name]\nAge: [Age]\nBlood type: [Type]\nAllergies: [List]\nMedications: [List]\n\nLast checkup: [Date]', position_x: 100, position_y: 80, width: 300, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Daily Metrics', content: 'Date: [Date]\n\nWeight: [X] lbs\nBlood pressure: [X]/[X]\nHeart rate: [X] bpm\nBlood sugar: [X]\nSteps: [X]\nWater: [X] glasses', position_x: 100, position_y: 280, width: 280, height: 200, color: '#34c75920' },
      { type: 'sticky_note', title: 'Symptom Log', content: 'Date: [Date]\nSymptom: [Description]\nSeverity: [1-10]\nDuration: [Time]\nPossible cause:\n\nAction taken:', position_x: 440, position_y: 80, width: 280, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Sleep Tracker', content: 'Date: [Date]\nBedtime: [Time]\nWake time: [Time]\nTotal hours: [X]\nQuality: [1-10]\n\nDisruptions:\n- [If any]', position_x: 440, position_y: 320, width: 280, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Medication Schedule', content: 'Medication 1: [Name]\n  Dose: [X]mg\n  Time: [Time]\n  Frequency: [Daily/etc]\n\nMedication 2: [Name]\n  Dose: [X]mg\n  Time: [Time]\n  Frequency: [Daily/etc]', position_x: 780, position_y: 80, width: 280, height: 200, color: '#ff648220' },
      { type: 'sticky_note', title: 'Appointments', content: 'Upcoming:\n- [Date] [Doctor] - [Purpose]\n- [Date] [Doctor] - [Purpose]\n\nCompleted:\n- [Date] [Doctor] - [Notes]\n\nFollow-ups needed:\n- [Item]', position_x: 780, position_y: 340, width: 280, height: 180, color: '#5ac8fa20' }
    ]
  },

  // ── Team & Collaboration ─────────────────────────────────────────────
  {
    id: 'onboarding',
    category: 'team',
    name: 'Team Onboarding',
    description: 'Guide new team members through their first weeks.',
    items: [
      { type: 'rich_note', title: 'Welcome', content: 'Welcome to the team, [Name]!\n\nStart date: [Date]\nManager: [Name]\nBuddy: [Name]\n\nTeam: [Team name]\nRole: [Position]', position_x: 100, position_y: 80, width: 320, height: 160, color: '#007aff20' },
      { type: 'sticky_note', title: 'Week 1: Orientation', content: 'Day 1:\n- [ ] Complete HR paperwork\n- [ ] Set up workstation\n- [ ] Meet team members\n- [ ] Review company handbook\n\nDay 2-5:\n- [ ] Training sessions\n- [ ] Shadow team member\n- [ ] Review documentation', position_x: 100, position_y: 300, width: 280, height: 240, color: '#34c75920' },
      { type: 'sticky_note', title: 'Week 2: Learning', content: '- [ ] Deep dive into projects\n- [ ] Review codebase/systems\n- [ ] Attend team meetings\n- [ ] Complete first small task\n- [ ] 1:1 with manager', position_x: 440, position_y: 300, width: 280, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Week 3-4: Contributing', content: '- [ ] Take on first project\n- [ ] Participate in code reviews\n- [ ] Give first presentation\n- [ ] Provide feedback on process\n- [ ] 30-day check-in', position_x: 780, position_y: 300, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Resources & Links', content: 'Documentation:\n- [Link 1]\n- [Link 2]\n\nTools:\n- [Tool 1]\n- [Tool 2]\n\nCommunication:\n- [Channel 1]\n- [Channel 2]', position_x: 440, position_y: 80, width: 280, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Key Contacts', content: 'Manager: [Name] - [Email]\nHR: [Name] - [Email]\nIT Support: [Name] - [Email]\nBuddy: [Name] - [Email]\n\nTeam channel: [Channel]', position_x: 780, position_y: 80, width: 280, height: 180, color: '#5ac8fa20' }
    ]
  },
  {
    id: 'brainstorm',
    category: 'team',
    name: 'Brainstorm Session',
    description: 'Facilitate creative brainstorming with structured idea generation.',
    items: [
      { type: 'rich_note', title: 'Session Info', content: 'Topic: [Challenge/Question]\nFacilitator: [Name]\nDuration: [X] minutes\nParticipants: [Names]\n\nRules:\n1. No criticism\n2. Wild ideas welcome\n3. Build on others\' ideas\n4. One conversation at a time', position_x: 100, position_y: 80, width: 320, height: 180, color: '#007aff20' },
      { type: 'sticky_note', title: 'Round 1: Free Ideas', content: '+ Idea 1\n+ Idea 2\n+ Idea 3\n+ Idea 4\n+ Idea 5\n+ Idea 6\n+ Idea 7\n+ Idea 8', position_x: 100, position_y: 320, width: 260, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Round 2: Deep Dive', content: 'Selected ideas to explore:\n\n1. [Idea A]\n   - Details\n   - Benefits\n   - Challenges\n\n2. [Idea B]\n   - Details\n   - Benefits\n   - Challenges', position_x: 420, position_y: 320, width: 300, height: 240, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Round 3: Voting', content: 'Dot voting results:\n\n1. [Idea] - [X] votes\n2. [Idea] - [X] votes\n3. [Idea] - [X] votes\n4. [Idea] - [X] votes\n5. [Idea] - [X] votes', position_x: 780, position_y: 320, width: 280, height: 200, color: '#af52de20' },
      { type: 'sticky_note', title: 'Action Plan', content: 'Top idea: [Selected]\n\nNext steps:\n1. [Action] → Owner: [Name]\n2. [Action] → Owner: [Name]\n3. [Action] → Owner: [Name]\n\nFollow-up: [Date]', position_x: 100, position_y: 600, width: 320, height: 160, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Parking Lot', content: 'Ideas for later:\n- [Idea]\n- [Idea]\n- [Idea]\n\nRelated topics:\n- [Topic]\n- [Topic]', position_x: 480, position_y: 600, width: 280, height: 160, color: '#ffd60a20' }
    ]
  },
  {
    id: 'decision-matrix',
    category: 'team',
    name: 'Decision Matrix',
    description: 'Evaluate options systematically with weighted criteria.',
    items: [
      { type: 'rich_note', title: 'Decision Context', content: 'Decision: [What needs to be decided]\nDeadline: [Date]\nDecision maker: [Name]\nStakeholders: [Names]\n\nConstraints: [List]', position_x: 100, position_y: 80, width: 320, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Criteria & Weights', content: '1. [Criterion 1] - Weight: [X]\n2. [Criterion 2] - Weight: [X]\n3. [Criterion 3] - Weight: [X]\n4. [Criterion 4] - Weight: [X]\n5. [Criterion 5] - Weight: [X]\n\nTotal weight: 100', position_x: 100, position_y: 280, width: 300, height: 200, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Option A', content: 'Name: [Option name]\nDescription: [Brief]\n\nScores:\n- Criterion 1: [X/10]\n- Criterion 2: [X/10]\n- Criterion 3: [X/10]\n- Criterion 4: [X/10]\n- Criterion 5: [X/10]\n\nWeighted total: [X]', position_x: 460, position_y: 80, width: 280, height: 220, color: '#34c75920' },
      { type: 'sticky_note', title: 'Option B', content: 'Name: [Option name]\nDescription: [Brief]\n\nScores:\n- Criterion 1: [X/10]\n- Criterion 2: [X/10]\n- Criterion 3: [X/10]\n- Criterion 4: [X/10]\n- Criterion 5: [X/10]\n\nWeighted total: [X]', position_x: 460, position_y: 360, width: 280, height: 220, color: '#af52de20' },
      { type: 'sticky_note', title: 'Option C', content: 'Name: [Option name]\nDescription: [Brief]\n\nScores:\n- Criterion 1: [X/10]\n- Criterion 2: [X/10]\n- Criterion 3: [X/10]\n- Criterion 4: [X/10]\n- Criterion 5: [X/10]\n\nWeighted total: [X]', position_x: 800, position_y: 80, width: 280, height: 220, color: '#ff648220' },
      { type: 'sticky_note', title: 'Final Decision', content: 'Selected option: [Name]\n\nRationale:\n[Why this option was chosen]\n\nRisks:\n- [Risk 1]\n- [Risk 2]\n\nMitigation:\n- [Strategy]', position_x: 800, position_y: 360, width: 280, height: 200, color: '#30d15820' }
    ]
  },
  {
    id: 'problem-solving',
    category: 'team',
    name: 'Problem Solving',
    description: 'Structured approach to identifying and solving problems.',
    items: [
      { type: 'rich_note', title: 'Problem Statement', content: 'Problem: [Clear description]\nImpact: [Who/what is affected]\nUrgency: [High/Medium/Low]\nDiscovered: [Date]\n\nReported by: [Name]', position_x: 100, position_y: 80, width: 320, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Root Cause Analysis', content: 'Why 1: [Answer]\nWhy 2: [Answer]\nWhy 3: [Answer]\nWhy 4: [Answer]\nWhy 5: [Answer]\n\nRoot cause: [Finding]', position_x: 100, position_y: 280, width: 280, height: 200, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Solution Options', content: 'Option A: [Description]\n  Pros: [List]\n  Cons: [List]\n  Effort: [Low/Med/High]\n\nOption B: [Description]\n  Pros: [List]\n  Cons: [List]\n  Effort: [Low/Med/High]', position_x: 440, position_y: 80, width: 320, height: 240, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Selected Solution', content: 'Chosen: [Option]\n\nImplementation plan:\n1. [Step 1] - [Owner] - [Date]\n2. [Step 2] - [Owner] - [Date]\n3. [Step 3] - [Owner] - [Date]\n\nResources needed:', position_x: 440, position_y: 380, width: 320, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Success Criteria', content: 'How we\'ll know it worked:\n- [Metric 1]: [Target]\n- [Metric 2]: [Target]\n- [Metric 3]: [Target]\n\nReview date: [Date]\nOwner: [Name]', position_x: 820, position_y: 80, width: 280, height: 160, color: '#af52de20' },
      { type: 'sticky_note', title: 'Prevention', content: 'To prevent recurrence:\n- [Preventive measure 1]\n- [Preventive measure 2]\n- [Preventive measure 3]\n\nProcess changes:\n- [Change 1]\n- [Change 2]', position_x: 820, position_y: 300, width: 280, height: 180, color: '#30d15820' }
    ]
  },
  {
    id: 'communication-plan',
    category: 'team',
    name: 'Communication Plan',
    description: 'Define team communication channels, cadence, and protocols.',
    items: [
      { type: 'rich_note', title: 'Plan Overview', content: 'Team: [Name]\nProject: [Name]\nCreated: [Date]\n\nObjective: Ensure clear, consistent communication across all stakeholders.\n\nReview cycle: [Monthly]', position_x: 100, position_y: 80, width: 340, height: 140, color: '#007aff20' },
      { type: 'sticky_note', title: 'Daily Communication', content: 'Standup: 9:15 AM daily\n  Duration: 15 min\n  Format: [In-person/Video]\n  Attendees: Core team\n\nSlack response time: < 1 hour\nEmail response time: < 4 hours', position_x: 100, position_y: 280, width: 300, height: 180, color: '#34c75920' },
      { type: 'sticky_note', title: 'Weekly Communication', content: 'Team meeting: [Day] [Time]\n  Duration: [X] min\n  Agenda: [Standard/Ad-hoc]\n\n1:1s: [Day] [Time]\n  Duration: 30 min\n\nSprint review: [Day] [Time]', position_x: 460, position_y: 80, width: 300, height: 180, color: '#ff9f0a20' },
      { type: 'sticky_note', title: 'Channels & Tools', content: 'Urgent: [Phone/Text]\nQuick questions: [Slack channel]\nDeep discussions: [Video call]\nDocumentation: [Wiki/Docs]\nProject updates: [Tool]\nFile sharing: [Platform]', position_x: 460, position_y: 320, width: 300, height: 180, color: '#af52de20' },
      { type: 'sticky_note', title: 'Escalation Path', content: 'Level 1: Team lead\n  For: Day-to-day issues\n\nLevel 2: Manager\n  For: Resource/scope issues\n\nLevel 3: Director\n  For: Strategic decisions\n\nEmergency: [Contact]', position_x: 820, position_y: 80, width: 280, height: 200, color: '#ff3b3020' },
      { type: 'sticky_note', title: 'Stakeholder Updates', content: 'Executives: [Monthly summary]\n  Format: Email + Dashboard\n\nClients: [Weekly/Bi-weekly]\n  Format: [Video/Email]\n\nCross-functional: [As needed]\n  Format: [Meeting/Doc]', position_x: 820, position_y: 340, width: 280, height: 180, color: '#ff648220' },
      { type: 'sticky_note', title: 'Meeting Guidelines', content: 'All meetings must have:\n- Agenda (shared 24h prior)\n- Timebox per topic\n- Note taker\n- Action items documented\n- Start/end on time\n\nNo meeting days: [Day]', position_x: 1160, position_y: 80, width: 280, height: 180, color: '#5ac8fa20' }
    ]
  }
];

class _TemplateEngine {
  getTemplate(id) {
    return BOARD_TEMPLATES.find(function(t) { return t.id === id; }) || null;
  }

  getTemplatesByCategory(category) {
    if (category === 'all') {
      return BOARD_TEMPLATES;
    }
    return BOARD_TEMPLATES.filter(function(t) { return t.category === category; });
  }

  getAllTemplates() {
    return BOARD_TEMPLATES;
  }

  getCategories() {
    return TEMPLATE_CATEGORIES;
  }

  async applyTemplate(boardId, templateId) {
    var template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found: ' + templateId);
    }

    var items = template.items.map(function(item) {
      return {
        board_id: boardId,
        type: item.type,
        title: item.title,
        content: item.content,
        position_x: item.position_x,
        position_y: item.position_y,
        width: item.width,
        height: item.height,
        color: item.color,
        created_at: new Date().toISOString()
      };
    });

    if (BoardFlowAuth.supabase) {
      const { error } = await BoardFlowAuth.supabase
        .from('items')
        .insert(items);

      if (error) {
        throw new Error('Failed to save template: ' + error.message);
      }
    } else {
      var stored = localStorage.getItem('boardflow_items_' + boardId);
      var existingItems = stored ? JSON.parse(stored) : [];
      var newItems = items.map(function(item, index) {
        return Object.assign({}, item, { id: 'local_' + Date.now() + '_' + index });
      });
      existingItems = existingItems.concat(newItems);
      localStorage.setItem('boardflow_items_' + boardId, JSON.stringify(existingItems));
    }

    return { success: true, template: template.name, itemCount: items.length };
  }
}

try {
  Object.defineProperty(window, 'TemplateEngine', { value: new _TemplateEngine(), writable: false, configurable: true, enumerable: true });
} catch { window.TemplateEngine = new _TemplateEngine(); }
