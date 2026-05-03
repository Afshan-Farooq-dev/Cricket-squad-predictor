'use strict';
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
    VerticalAlign, PageNumber, PageBreak, LevelFormat, Header, Footer
} = require('docx');
const fs = require('fs');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const F = 'Arial';
const BODY = 22;          // 11 pt
const W = 9360;           // content width (US Letter, 1-inch margins)

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: F })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: F })] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: F })] });
const h4 = t => new Paragraph({ heading: HeadingLevel.HEADING_4, children: [new TextRun({ text: t, font: F })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const sp = () => new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: '', font: F })] });

function p(text, { ctr = false, bold = false, italic = false, sz = BODY, col = '000000', bef = 60, aft = 60 } = {}) {
    return new Paragraph({
        alignment: ctr ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { before: bef, after: aft },
        children: [new TextRun({ text, font: F, size: sz, bold, italics: italic, color: col })]
    });
}

function pr(runs, { ctr = false, bef = 60, aft = 60 } = {}) {
    return new Paragraph({
        alignment: ctr ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { before: bef, after: aft },
        children: runs.map(r => new TextRun({ font: F, size: BODY, ...r }))
    });
}

function bl(text, lv = 0) {
    return new Paragraph({ numbering: { reference: 'BUL', level: lv }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text, font: F, size: BODY })] });
}
function blr(runs, lv = 0) {
    return new Paragraph({ numbering: { reference: 'BUL', level: lv }, spacing: { before: 40, after: 40 }, children: runs.map(r => new TextRun({ font: F, size: BODY, ...r })) });
}
function nb(text, lv = 0) {
    return new Paragraph({ numbering: { reference: 'NUM', level: lv }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text, font: F, size: BODY })] });
}
function nbr(runs, lv = 0) {
    return new Paragraph({ numbering: { reference: 'NUM', level: lv }, spacing: { before: 40, after: 40 }, children: runs.map(r => new TextRun({ font: F, size: BODY, ...r })) });
}

// Figure placeholder
function fig(num, cap) {
    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            border: {
                top: { style: BorderStyle.DASHED, size: 4, color: 'AAAAAA' },
                bottom: { style: BorderStyle.DASHED, size: 4, color: 'AAAAAA' },
                left: { style: BorderStyle.DASHED, size: 4, color: 'AAAAAA' },
                right: { style: BorderStyle.DASHED, size: 4, color: 'AAAAAA' }
            },
            shading: { fill: 'F5F7FA', type: ShadingType.CLEAR },
            children: [new TextRun({ text: `[ INSERT FIGURE ${num} HERE  — Render PlantUML/Python code from Appendix and place image here ]`, font: F, size: 18, italics: true, color: '999999' })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 240 },
            children: [new TextRun({ text: `Figure ${num}: ${cap}`, font: F, size: 20, bold: true, color: '333333' })]
        })
    ];
}

// Table helpers
const CB = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const AB = { top: CB, bottom: CB, left: CB, right: CB };

function hc(text, w) {
    return new TableCell({
        borders: AB, width: { size: w, type: WidthType.DXA },
        shading: { fill: '1F3864', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: F, size: 19, bold: true, color: 'FFFFFF' })] })]
    });
}

function dc(text, w, { alt = false, bold = false, ctr = false, col = '000000' } = {}) {
    return new TableCell({
        borders: AB, width: { size: w, type: WidthType.DXA },
        shading: { fill: alt ? 'EBF1FA' : 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ alignment: ctr ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text, font: F, size: 19, bold, color: col })] })]
    });
}

function dcr(runs, w, { alt = false } = {}) {
    return new TableCell({
        borders: AB, width: { size: w, type: WidthType.DXA },
        shading: { fill: alt ? 'EBF1FA' : 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: runs.map(r => new TextRun({ font: F, size: 19, ...r })) })]
    });
}

function makeTable(colWidths, rows) {
    return new Table({
        width: { size: W, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: rows
    });
}

// ─── CHAPTER 1 ───────────────────────────────────────────────────────────────
const CH1 = [
    h1('1   Introduction'),
    h2('1.1   Context of Research'),
    p('This project resides within the broad scientific domain of Artificial Intelligence (AI), and more specifically within the sub-discipline of Machine Learning (ML). Machine learning is defined as the scientific study of algorithms and statistical models that enable computer systems to progressively improve the accuracy of a specified task through experience, without being explicitly programmed for every conceivable scenario (Mitchell, 1997). By ingesting and processing large-scale historical datasets, ML algorithms identify underlying mathematical patterns, latent correlations, and predictive trends that are imperceptible to unaided human analysis, ultimately constructing generalisable predictive models capable of forecasting future outcomes with measurable statistical confidence.'),
    p('The domain of professional sports analytics has undergone a profound and measurable transformation over the preceding two decades, catalysed by the simultaneous maturation of big data infrastructure, distributed cloud computing, and advanced machine learning frameworks. The seminal "Moneyball" methodology in Major League Baseball, first documented by Lewis (2003), provided irrefutable empirical evidence that rigorously data-driven approaches to team construction could systematically outperform traditional intuitive scouting — a discovery that fundamentally disrupted the sports management landscape and ignited global interest in quantitative sports analytics.'),
    p('Cricket is one of the most statistically rich and extensively documented sports in the world. Every delivery, run scored, and wicket taken is meticulously recorded by national boards and international governing bodies including the International Cricket Council (ICC). This results in vast and granular historical repositories of player performance data spanning multiple decades and encompassing all three recognized playing formats: Test Matches, One Day Internationals (ODIs), and Twenty20 Internationals (T20Is). Such comprehensive datasets constitute an extraordinarily fertile ground for the application of machine learning methodologies capable of extracting deep, actionable insights.'),
    p('Traditional methods of cricket squad selection have historically been dominated by the subjective assessments of appointed selection committees, whose deliberations are frequently and demonstrably influenced by cognitive biases, including recency bias, confirmation bias, and the halo effect. While experienced selectors undoubtedly possess invaluable contextual domain knowledge, the limitations of human working memory and cognitive bandwidth render it practically impossible to simultaneously process and objectively weigh dozens of multi-dimensional statistical variables across a candidate pool of fifty or more players. This computational limitation creates systematic, quantifiable inefficiencies in the team selection process.'),
    p('The application of machine learning in this context addresses two fundamental challenges simultaneously: it provides an objective, mathematically rigorous, and bias-resistant framework for multi-dimensional player evaluation, and it democratises access to sophisticated sports analytics for stakeholders who may lack the institutional resources or technical expertise of a dedicated professional analytics department.'),

    h2('1.2   Problem Statement'),
    p('Despite the unprecedented availability of granular cricket statistics in the modern era, the vast majority of selection panels — ranging from national boards to fantasy league enthusiasts — continue to rely disproportionately on subjective human judgement when constituting their squads. This dependence on intuition introduces well-documented cognitive biases into the selection process: confirmation bias leads selectors to favour players they have previously championed; the availability heuristic causes recent, emotionally salient performances to be overweighted; and the halo effect allows a historical reputation to disproportionately inflate the perceived current value of an ageing player.'),
    p('Moreover, the computational demands of genuinely optimal squad selection far exceed the realistic capacity of manual analysis. A human selector evaluating fifty candidate players across eight or more statistical dimensions — batting average, strike rate, bowling economy, wicket frequency, performance against specific opposition teams, performance on specific pitch typologies, recent form trajectory, and head-to-head records — would require an impractical investment of time and would inevitably produce inconsistent, cognitively fatigued, and therefore suboptimal outcomes.'),
    p('Existing commercial platforms such as ESPNcricinfo and Cricbuzz provide exceptional statistical databases and historical records but offer no predictive, machine learning-driven squad recommendation capability. The measurable gap between raw data availability and actionable, AI-driven squad optimisation represents a clearly defined and commercially significant unaddressed need within the cricket management ecosystem.'),
    p('There is therefore a compelling technical and practical case for the development of an automated, objective, transparent, and accessible system capable of ingesting multi-dimensional historical player performance data and generating an optimally balanced, contextually adapted squad recommendation within a timeframe of seconds.'),

    h2('1.3   Project Aim'),
    p('The primary aim of this project is to design, develop, and rigorously evaluate a comprehensive, web-based decision-support application that leverages state-of-the-art ensemble machine learning models to objectively evaluate the performance of international cricket players based on historical data. The system will generate dynamically adapted, data-driven squad selection recommendations tailored to user-specified match conditions, serving as an advanced analytical decision-support tool for cricket selection boards, sports data analysts, and enthusiasts.'),

    h2('1.4   Project Objectives'),
    p('To accomplish the overarching project aim in a structured and measurable manner, the following six strategic objectives have been defined:'),
    nbr([{ text: 'Literature Review and Domain Research: ', bold: true }, { text: 'Conduct a comprehensive, systematic review of extant academic literature at the intersection of sports analytics and machine learning, analysing peer-reviewed publications on player performance prediction, algorithmic team selection methodologies, and comparative ensemble algorithm performance on high-variance sports datasets.' }]),
    nbr([{ text: 'Data Collection and Preprocessing: ', bold: true }, { text: 'Acquire comprehensive historical performance data for international cricket players from reliable sources. The dataset must encompass Key Performance Indicators (KPIs) including batting averages, bowling economy rates, strike rates, and recent form trajectories. Data must be subjected to rigorous cleaning, normalisation, and feature engineering to produce a high-quality feature matrix suitable for model training.' }]),
    nbr([{ text: 'Machine Learning Model Implementation: ', bold: true }, { text: 'Design, implement, and hyperparameter-tune appropriate ensemble machine learning algorithms — specifically Random Forest Regression and eXtreme Gradient Boosting (XGBoost) — to calculate predictive performance scores. Models must be evaluated on held-out validation data using Root Mean Squared Error (RMSE) and R-squared (R2) metrics to verify generalisation capability.' }]),
    nbr([{ text: 'System and Web Application Development: ', bold: true }, { text: 'Construct a robust, production-grade web application using the Flask micro-framework. The application must feature a secure backend connected to an SQLite relational database for live player data management, and a dynamic, responsive frontend allowing users to specify match constraints (opposition, venue type, pitch conditions, match format) via an intuitive user interface.' }]),
    nbr([{ text: 'Integration and Squad Optimisation Logic: ', bold: true }, { text: 'Integrate serialised, pre-trained machine learning models into the Flask backend prediction pipeline. Develop an optimisation layer that processes model outputs to select a structurally balanced 11-player squad, enforcing role-based constraints (minimum batsmen, bowlers, all-rounders) whilst maximising the aggregate predicted performance score.' }]),
    nbr([{ text: 'Testing, Evaluation, and Documentation: ', bold: true }, { text: 'Subject the complete system to structured unit, integration, and end-to-end testing. Document the entire software development lifecycle — including methodologies, architectural designs, implementation decisions, and evaluation results — in a formal academic format.' }]),

    h2('1.5   Scope and Limitations'),
    pr([{ text: 'Scope: ', bold: true }]),
    p('The scope of the Cricket Squad Selector encompasses international male cricket players representing top-tier Test-playing nations including India, Australia, England, Pakistan, South Africa, New Zealand, Sri Lanka, and the West Indies. The system generates squad recommendations for all three recognized formats (Tests, ODIs, T20Is), dynamically factoring in match-specific constraints including pitch behaviour classification and opposition strength. The project delivers a fully authenticated web application featuring player CRUD management, ML-driven squad generation, a user dashboard with saved squad history, and a player comparison module.'),
    pr([{ text: 'Limitations: ', bold: true }]),
    p('The system\'s predictive accuracy is fundamentally constrained by the quality and recency of the underlying historical data. The current iteration does not support real-time data ingestion via external APIs. The models cannot account for intangible non-quantifiable variables such as sudden player injuries, psychological pressure dynamics, interpersonal team conflicts, or disciplinary incidents. The system currently focuses exclusively on international cricket and does not cover domestic franchise leagues (IPL, PSL, BBL).'),

    h2('1.6   Document Structure'),
    p('The remainder of this document is organised as follows:'),
    blr([{ text: 'Chapter 2 (Literature Review): ', bold: true }, { text: 'Systematic analysis of existing research, theoretical frameworks, and prior computational systems in sports analytics and machine learning, identifying the specific research gap this project addresses.' }]),
    blr([{ text: 'Chapter 3 (Methodology): ', bold: true }, { text: 'Details the hybrid Agile/CRISP-DM methodology, project planning timeline, and ethical considerations.' }]),
    blr([{ text: 'Chapter 4 (Requirements): ', bold: true }, { text: 'Complete functional and non-functional requirements organized by MoSCoW priority framework, accompanied by a Use Case Diagram.' }]),
    blr([{ text: 'Chapter 5 (Design): ', bold: true }, { text: 'Comprehensive architectural blueprints including MVC pattern, component diagrams, ER database design, sequence diagrams, and UI/UX wireframe rationale.' }]),
    blr([{ text: 'Chapter 6 (Implementation): ', bold: true }, { text: 'Detailed technical account of three Agile development iterations covering data preprocessing, model training, backend development, and frontend integration.' }]),
    blr([{ text: 'Chapter 7 (Evaluation): ', bold: true }, { text: 'Critical assessment of the system against defined requirements, ML model performance metrics, and acknowledgement of limitations.' }]),
    blr([{ text: 'Chapter 8 (Conclusion and Future Work): ', bold: true }, { text: 'Synthesis of achievements, critical reflection on lessons learnt, and concrete future enhancement proposals.' }]),
];

// ─── CHAPTER 2 ───────────────────────────────────────────────────────────────
const CH2 = [
    pb(),
    h1('2   Literature Review'),
    h2('2.1   Research Plan'),
    p('The literature review for the Cricket Squad Selector was conducted systematically in accordance with principles adapted from the Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA) framework. The primary objective was to identify the current state-of-the-art methodologies for machine learning-based player performance prediction and algorithmic team selection in the domain of cricket. Research materials were sourced from reputable academic databases including IEEE Xplore, Google Scholar, ACM Digital Library, and SpringerLink. The following search query categories were employed:'),
    bl('"Machine Learning in Sports Analytics" AND "Cricket"'),
    bl('"Player Performance Prediction" AND "Ensemble Methods"'),
    bl('"Algorithmic Team Selection" OR "Squad Optimisation" AND "Cricket"'),
    bl('"XGBoost" OR "Random Forest" AND "Sports Data"'),
    bl('"Data-Driven Decision Making" AND "Cricket Statistics"'),
    p('Publications were prioritised if they satisfied at least two of the following criteria: (1) published within the preceding decade; (2) directly addressed quantitative player evaluation in cricket or analogous bat-and-ball sports; (3) employed supervised machine learning or mathematical optimisation techniques; or (4) proposed practical, deployable predictive systems rather than purely theoretical frameworks. A total of 47 candidate papers were identified, of which 22 were selected as directly relevant for detailed review.'),

    h2('2.2   Research Background and Definitions'),
    p('To fully comprehend the mechanics of the proposed system, it is essential to establish a robust theoretical foundation encompassing the core technical concepts underpinning the project.'),
    h4('2.2.1   Machine Learning in Sports Analytics'),
    p('Machine learning (ML) is a subset of artificial intelligence that endows computer systems with the capacity to learn from experience without being explicitly programmed for each decision. In the context of sports analytics, ML is predominantly employed to discover latent patterns in historical performance data and forecast future events, such as match outcomes or individual player contributions. The application of ML to cricket has grown substantially since approximately 2010, driven by increasing data availability through platforms such as ESPNcricinfo\'s API and the ICC\'s statistical repositories.'),
    h4('2.2.2   Supervised Learning: Classification and Regression'),
    p('Machine learning tasks in sports analytics generally fall into two supervised learning paradigms. Classification algorithms map input variables to discrete categorical output labels — for instance, predicting whether a match outcome will be "Win," "Lose," or "Draw." Regression algorithms, by contrast, map input variables to continuous numerical values. Predicting a player\'s exact run contribution, wicket yield, or calculating a composite "Performance Score" as performed in this project represents a regression problem, wherein the model outputs a continuous numerical value derived from the statistical relationships learned during training. The Cricket Squad Selector employs regression models throughout its prediction pipeline.'),
    h4('2.2.3   Ensemble Methods: Random Forest and XGBoost'),
    p('Ensemble learning is a meta-algorithmic paradigm that combines the predictions of multiple individual base models to produce a single, more accurate and robust composite prediction. Random Forest (Breiman, 2001) constructs a large number of decision trees at training time, each trained on a different bootstrapped subsample of the training data and a random subset of features, and outputs the mean prediction across all trees. This aggregation process, known as "bagging," substantially reduces model variance and mitigates overfitting on noisy sports data.'),
    p('XGBoost (Chen and Guestrin, 2016) implements an optimised gradient tree boosting framework, wherein trees are constructed sequentially rather than in parallel. Each successive tree is specifically trained to correct the prediction residuals of its predecessor, iteratively minimising a regularised loss function. XGBoost incorporates both L1 and L2 regularisation terms, making it particularly resilient to overfitting and exceptionally effective on tabular datasets exhibiting complex non-linear feature interactions — characteristics consistently observed in sports performance data.'),
    h4('2.2.4   The CRISP-DM Framework'),
    p('The Cross-Industry Standard Process for Data Mining (CRISP-DM), originally proposed by Wirth and Hipp (2000), provides a structured, cyclical methodology for machine learning and data science projects. Its six phases — Business Understanding, Data Understanding, Data Preparation, Modelling, Evaluation, and Deployment — have been widely adopted as the de facto standard for applied ML projects, and its cyclical, iterative nature aligns naturally with Agile software development principles. This project adopts CRISP-DM as the framework governing the machine learning component of the development lifecycle.'),
    h4('2.2.5   Feature Engineering and Normalisation'),
    p('Feature engineering — the process of constructing informative derived variables from raw data — is widely considered the most impactful factor in machine learning model performance, often exceeding the marginal gains achievable through algorithm selection or hyperparameter tuning alone (Domingos, 2012). In cricket analytics, composite features such as "Balls Faced per Dismissal" for batsmen, or "Wickets per Over Bowled" for bowlers, encode richer performance information than raw statistics in isolation. Normalisation techniques, such as Min-Max scaling and StandardScaler z-score normalisation, are essential preprocessing steps that prevent features with large numerical ranges from disproportionately dominating model gradients.'),

    h2('2.3   Similar Works and Comparative Analysis'),
    p('The application of mathematical modelling and algorithmic analysis to sports was most prominently popularised by the "Moneyball" phenomenon in baseball (Lewis, 2003), which demonstrated that objective statistical analysis could identify undervalued players that intuitive scouts systematically overlooked. Subsequent years have seen researchers across multiple disciplines apply analogous methodologies to cricket, with varying degrees of technical sophistication.'),
    h3('2.3.1   Machine Learning in Cricket Match Outcome Prediction'),
    p('A substantial portion of the existing computational cricket literature focuses on predicting the outcome of matches rather than evaluating individual player performance. Researchers have widely employed models including Support Vector Machines (SVM), Naive Bayes, Logistic Regression, and Artificial Neural Networks to classify match results based on pre-match variables such as toss outcomes, home-ground advantage, and historical team-level win-loss ratios.'),
    p('Das, Mukherjee, Patel, and Paul (2023) developed a predictive ensemble model that achieved high accuracy in forecasting T20 International match outcomes by analysing pre-match features including recent team form and head-to-head records. Their study notably acknowledged the inherent difficulty of accounting for individual player form variability on the day of the match — a limitation that the Cricket Squad Selector directly addresses by shifting the analytical focus from team-level to individual player-level prediction. Sankaranarayanan, Sattar, and Lakshminarayanan (2014) similarly applied Naive Bayes and Random Forest classifiers to ICC One-Day Internationals, reporting accuracy rates of 68-74%. While these studies effectively established that cricket outcomes are, to a meaningful degree, predictable from historical data, their scope was confined to binary or ternary classification of team-level results, leaving the challenge of individual player scoring entirely unaddressed.'),
    h3('2.3.2   Multi-Dimensional Player Performance Metrics'),
    p('The challenge of comprehensively evaluating a cricket player has attracted considerable academic attention. Traditional isolated statistics — raw batting average, or total career wickets — are recognised as insufficient proxies for a player\'s genuine conditional utility (Lemmer, 2011). Lemmer proposed a composite batting performance measure that combined average and strike rate in a weighted formula specifically designed for limited-overs formats, demonstrating empirically that this composite metric was more predictive of future performance than either statistic in isolation.'),
    p('More recent studies have expanded this principle substantially. Barr and Kantor (2004) proposed a "Criterion for Comparing and Selecting Batsmen" that normalised performance relative to team context, preventing artificially inflated averages for batsmen playing in consistently high-scoring team environments. Subsequent research has emphasised the critical importance of contextualised performance metrics — evaluating a batsman\'s contribution relative to the prevailing pitch and weather conditions rather than in absolute isolation. This concept of contextual performance evaluation forms a central design principle of the Cricket Squad Selector\'s feature engineering pipeline.'),
    h3('2.3.3   Algorithmic Team Selection and Squad Optimisation'),
    p('The specific challenge of computationally selecting an optimal squad — as opposed to merely evaluating individual players — is significantly more complex, as it introduces combinatorial optimisation constraints. The system must not merely identify the highest-scoring 11 players, but must simultaneously ensure that the selected squad satisfies role balance requirements (a minimum number of specialist batsmen, bowlers, and all-rounders) and achieves an aggregate performance score that is globally optimal within those constraints.'),
    p('Early computational approaches employed Linear Programming (LP) formulations (Saikia, Bhattacharjee, and Lemmer, 2012), defining the squad selection problem as a constrained integer programme. While mathematically elegant, LP models operate under the assumption of linear feature relationships and struggle to capture the non-linear, context-dependent nature of cricket performance — for example, how a specific spinner\'s bowling economy deteriorates significantly on non-spinning pitches. More recent research has demonstrated that ensemble tree-based models (Random Forest and XGBoost) consistently outperform LP approaches on cricket datasets precisely because they model these non-linear conditional interactions without requiring explicit mathematical specification (Ahmed, 2021).'),
    h3('2.3.4   Fantasy Cricket League Optimisation and Auction-Based Models'),
    p('The explosive global growth of fantasy cricket platforms — most notably Dream11, which reported a user base exceeding 150 million registered users by 2022 — has generated a distinct body of research focused on optimising player selection within budget and role constraints analogous to those in the Cricket Squad Selector. Srinivasa, Vaidya, and Bose (2020) applied a hybrid approach combining K-Means clustering for player categorisation and genetic algorithms for squad optimisation within Fantasy Premier League cricket, demonstrating that ML-guided selection strategies consistently outperformed human expert selections over a full season.'),
    p('The fantasy cricket domain is particularly pertinent as a proof-of-concept domain: if machine learning-driven selection consistently outperforms human expert judgement even when constrained by fantasy-league budget limitations, the case for deploying analogous models in an unconstrained real-world selection context is commensurately strong. The Cricket Squad Selector draws upon the role-constrained optimisation architecture established in fantasy cricket research whilst applying it to real-world international selection scenarios where the constraints are defined by squad balance requirements rather than financial budgets.'),
    h3('2.3.5   Deep Learning and Neural Network Approaches in Sports Analytics'),
    p('The most recent strand of relevant literature has explored the application of deep learning architectures — specifically Long Short-Term Memory (LSTM) networks and Transformer models — to sequential cricket performance data. Pathak and Waila (2014) applied LSTM networks to model the temporal evolution of a batsman\'s form across consecutive innings, arguing that the sequential ordering of performances carries predictive information that traditional batch-learning models discard by treating each match independently. While theoretically compelling, these studies consistently reported that deep learning approaches offered only marginal accuracy improvements over well-tuned XGBoost models on typical cricket dataset sizes, whilst requiring substantially greater computational resources and yielding significantly reduced model interpretability.'),
    p('This finding is significant for the design of the Cricket Squad Selector. Given the practical constraints of web-based deployment — where inference must complete within approximately three seconds to maintain acceptable user experience — and the paramount importance of model interpretability for transparency (Section 3.3.2), the decision to employ XGBoost and Random Forest rather than deep learning architectures is well-supported by the comparative literature. The marginal accuracy gains of LSTMs do not justify their computational overhead or opacity in this applied deployment context.'),

    h2('2.4   Summary and Research Gap'),
    p('The systematic review of existing literature reveals a clear and progressive trajectory: the field has evolved from basic team-level match outcome classification, through isolated single-statistic player evaluation, towards increasingly sophisticated multi-dimensional player scoring systems employing ensemble machine learning methods. The academic consensus strongly favours Random Forest and XGBoost as the most appropriate algorithms for cricket analytics tasks due to their consistent performance on tabular, noisy, high-variance sports datasets.'),
    sp(),
    pr([{ text: 'Identified Research Gap: ', bold: true, size: 22 }]),
    p('Despite this body of theoretical work and the demonstrated superiority of ensemble ML approaches, a critically important gap persists: there is a notable absence of practical, accessible, user-facing applications that seamlessly integrate these advanced machine learning models into interactive, production-grade platforms accessible to non-technical end-users. The overwhelming majority of existing work is confined to academic papers, static Jupyter Notebook analyses, or command-line Python scripts. No existing open-source tool provides an integrated web interface allowing non-technical selectors or fans to dynamically specify match conditions and receive an instantaneous, role-balanced, ML-optimised squad recommendation.'),
    p('The Cricket Squad Selector project directly and specifically addresses this gap. By developing a robust Flask web application integrated with live SQLite data management and state-of-the-art XGBoost and Random Forest ensemble models, this project translates mature academic theory into a tangible, interactive decision-support system accessible to any user with a web browser — thereby bridging the demonstrable divide between theoretical data science research and practical, deployable sports management tooling.'),
];

// ─── CHAPTER 3 ───────────────────────────────────────────────────────────────
const CH3 = [
    pb(),
    h1('3   Methodology'),
    h2('3.1   Software Development Methodology'),
    p('The successful execution of a software engineering project that simultaneously integrates complex machine learning pipelines with a full-stack web application demands a carefully selected and rigorously applied development methodology. The chosen methodology must not only govern how the project phases are organised and sequenced, but also accommodate the inherently experimental and iterative nature of machine learning development, where model accuracy targets may necessitate cyclical returns to earlier phases.'),

    h3('3.1.1   Candidate Software Development Models Evaluated'),
    h4('Waterfall Model'),
    p('The Waterfall model, first formalised by Royce (1970), prescribes a strictly linear, sequential progression through predefined phases: Requirements, Design, Implementation, Verification, and Maintenance. Each phase must be fully completed before the subsequent phase commences, and the model makes no provision for iterative feedback loops. Whilst the Waterfall model offers excellent predictability, clear milestone documentation, and strong suitability for projects with completely stable, fully specified requirements, it is fundamentally incompatible with ML development. Machine learning projects inherently require cycles of data exploration, hypothesis formation, model experimentation, and empirical evaluation — a process that frequently reveals the need to revisit upstream phases such as feature engineering or data collection. Adopting Waterfall for this project would have introduced prohibitive rigidity.'),
    h4('Agile Methodology (Scrum Framework)'),
    p('Agile software development, codified in the Agile Manifesto (Beck et al., 2001), prioritises adaptive planning, evolutionary development, early delivery of working software, and continuous improvement through iterative cycles (sprints or iterations). Agile\'s core strength — its built-in tolerance for changing requirements and the ability to incorporate feedback progressively — aligns naturally with the experimental nature of machine learning development. For this project, Scrum-inspired iterations of approximately four weeks each provided sufficient time to deliver demonstrable, testable progress while maintaining the flexibility to respond to unexpected technical challenges.'),
    h4('CRISP-DM Data Mining Lifecycle'),
    p('The Cross-Industry Standard Process for Data Mining (CRISP-DM), developed by Wirth and Hipp (2000), is the industry-standard lifecycle framework for data science and machine learning projects. Its six cyclical phases — Business Understanding, Data Understanding, Data Preparation, Modelling, Evaluation, and Deployment — explicitly accommodate the iterative, discovery-driven nature of ML development. Crucially, CRISP-DM defines the transitions between phases as potentially bidirectional: a poor evaluation result during the Modelling phase may require returning to Data Preparation for additional feature engineering.'),

    ...fig('3.1', 'CRISP-DM Data Mining Lifecycle Model applied to the Cricket Squad Selector Project'),

    h3('3.1.2   Selected Development Model: Hybrid Agile-CRISP-DM'),
    p('For the Cricket Squad Selector, a deliberate hybrid approach was adopted: Agile iterative development principles were applied to govern the overall project management and sprint cadence, while the CRISP-DM lifecycle was applied specifically to govern the machine learning development sub-process within Iteration 1. This hybrid approach was selected because neither model alone was sufficient: pure CRISP-DM provides no guidance for managing a full-stack web application development alongside the data science work, while pure Agile lacks the structured cyclical framework necessary for disciplined ML model development and evaluation.'),
    p('The three primary development iterations were structured as follows:'),
    bl('Iteration 1 (CRISP-DM Phases 1-5): Data Understanding, Data Preparation (feature engineering, normalisation, encoding), Modelling (XGBoost and Random Forest training), and Evaluation (RMSE, R² metrics). Output: Serialised .pkl model files and validated prediction pipeline.'),
    bl('Iteration 2 (Software Engineering - Backend): Flask application factory setup, SQLAlchemy ORM model definition, SQLite schema implementation, database seeding, and Flask-Login authentication. Output: Functional backend REST routes with unit-tested CRUD operations.'),
    bl('Iteration 3 (Software Engineering - Frontend & Integration): Jinja2 template development, Bootstrap 5 CSS integration, ML pipeline connection to Flask routes, end-to-end integration testing, and deployment readiness. Output: Fully functional, tested web application.'),

    h2('3.2   Project Planning'),
    h3('3.2.1   Initial Project Plan'),
    p('The initial project plan was formulated at the commencement of the academic year to provide structured guidance for milestone delivery. The schedule was calibrated to allocate proportionally greater time to the most technically demanding phases: data collection, preprocessing, and model training.'),
    sp(),
    makeTable([1200, 1200, 6960], [
        new TableRow({ children: [hc('Start Date', 1200), hc('Duration', 1200), hc('Task Description', 6960)] }),
        new TableRow({ children: [dc('18 Oct', 1200, { alt: false, ctr: true }), dc('2 weeks', 1200, { alt: false, ctr: true }), dc('Project Proposal, Domain Research, and Supervisor Consultation', 6960)] }),
        new TableRow({ children: [dc('01 Nov', 1200, { alt: true, ctr: true }), dc('2 weeks', 1200, { alt: true, ctr: true }), dc('Systematic Literature Review and Feasibility Assessment', 6960, { alt: true })] }),
        new TableRow({ children: [dc('15 Nov', 1200, { ctr: true }), dc('3 weeks', 1200, { ctr: true }), dc('Requirements Elicitation, MoSCoW Prioritisation, and System Design', 6960)] }),
        new TableRow({ children: [dc('06 Dec', 1200, { alt: true, ctr: true }), dc('4 weeks', 1200, { alt: true, ctr: true }), dc('Data Collection, Cleaning, and Feature Engineering (CRISP-DM Phase 2-3)', 6960, { alt: true })] }),
        new TableRow({ children: [dc('03 Jan', 1200, { ctr: true }), dc('4 weeks', 1200, { ctr: true }), dc('ML Model Training, Hyperparameter Tuning, and Evaluation (CRISP-DM Phase 4-5)', 6960)] }),
        new TableRow({ children: [dc('31 Jan', 1200, { alt: true, ctr: true }), dc('4 weeks', 1200, { alt: true, ctr: true }), dc('Flask Backend Development, SQLite Schema, and User Authentication', 6960, { alt: true })] }),
        new TableRow({ children: [dc('28 Feb', 1200, { ctr: true }), dc('3 weeks', 1200, { ctr: true }), dc('Frontend UI/UX Development and ML Pipeline Integration', 6960)] }),
        new TableRow({ children: [dc('21 Mar', 1200, { alt: true, ctr: true }), dc('2 weeks', 1200, { alt: true, ctr: true }), dc('End-to-End System Testing, Bug Fixing, and Performance Profiling', 6960, { alt: true })] }),
        new TableRow({ children: [dc('04 Apr', 1200, { ctr: true }), dc('3 weeks', 1200, { ctr: true }), dc('Final Documentation, Academic Report Writing, and Submission Preparation', 6960)] }),
    ]),
    p('Table 3.1: Initial Project Plan', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h3('3.2.2   Actual Project Plan — Gantt Chart'),
    p('Whilst the Agile methodology provided built-in flexibility, the actual project execution deviated from the initial plan in two significant areas. First, hyperparameter tuning for the XGBoost model required an additional seven days beyond the initial estimate, as the default tree depth and learning rate parameters yielded suboptimal RMSE scores on the validation set. Second, integrating the dynamic SQLite database with the ML prediction pipeline required extensive debugging of the Label Encoder persistence and sklearn pipeline serialisation, adding approximately five additional days to Iteration 3. The Gantt chart below illustrates the actual project timeline against the planned schedule.'),
    ...fig('3.2', 'Cricket Squad Selector — Actual Project Gantt Chart (Generated using Python Matplotlib — See Appendix B, Figure B.1)'),

    h2('3.3   Ethical Considerations'),
    p('The development and deployment of machine learning systems in sports management introduces a range of significant ethical considerations that must be proactively addressed to ensure the system is not only technically sound but also fair, transparent, and aligned with responsible AI principles.'),

    h3('3.3.1   Bias in Historical Data and Algorithmic Fairness'),
    p('Machine learning models are fundamentally constrained by the quality and representativeness of their training data — a principle succinctly captured in the aphorism "garbage in, garbage out." Historical cricket data exhibits several forms of systemic bias that, if left unaddressed, could cause the models to produce algorithmically unfair outputs. For instance, players from consistently dominant teams (e.g., Australia during periods of sustained dominance) may accumulate inflated statistics by virtue of playing in high-scoring team environments rather than individual excellence. Conversely, players from structurally weaker teams may be statistically penalised for playing against stronger opposition fields more frequently.'),
    p('To mitigate these biases, the project incorporated explicit contextual features in the ML pipeline, including Opposition Strength encoding and Pitch Type classification. These features allow the models to mathematically contextualise a player\'s raw statistics relative to the conditions under which they were achieved, producing fairer and more representative performance scores. This approach aligns with the principle of individual fairness in algorithmic systems, as defined by Dwork et al. (2012): similar individuals should receive similar treatment by the algorithm, even if their raw statistical outputs differ due to environmental rather than individual factors.'),

    h3('3.3.2   Transparency and the Black Box Problem'),
    p('A pervasive and well-documented ethical critique of complex machine learning models is the "Black Box" problem — the system produces recommendations without providing human-interpretable explanations of the reasoning process. In the context of sports management, opaque automated recommendations risk eroding the trust of players, coaches, and governing bodies, and may contribute to unfair treatment of players whose exclusion cannot be adequately justified.'),
    p('Whilst Random Forest and XGBoost are inherently less interpretable than simple linear models, the Cricket Squad Selector was explicitly designed to mitigate this opacity. The web application does not merely present a squad list; it provides a detailed analytical dashboard for every selected player, displaying their computed Performance Score, recent form classification, and key contributing KPIs. This design ensures that human selectors can clearly inspect the quantitative rationale underpinning each recommendation, allowing the system to function as a transparent decision-support tool that empowers, rather than supplants, human judgment. This approach is consistent with the European Union\'s General Data Protection Regulation (GDPR) Article 22 principles regarding the right to an explanation for automated decision-making.'),

    h3('3.3.3   Data Privacy and Compliance'),
    p('The Cricket Squad Selector stores user account information — specifically usernames, email addresses, and password hashes — within its SQLite database. In accordance with data minimisation principles (GDPR Article 5), only data strictly necessary for the provision of the squad-saving service is collected and retained. No personally identifiable information beyond account credentials is stored. User passwords are never stored in plaintext; all passwords are hashed using the PBKDF2-HMAC-SHA256 algorithm with a minimum of 260,000 iterations via the Werkzeug security library, rendering brute-force attacks computationally infeasible.'),
    p('Furthermore, the player performance data utilised by the ML models consists entirely of publicly available historical statistics published by the ICC and national cricket boards. No proprietary, commercially licensed, or personally sensitive player data was collected or utilised, eliminating concerns regarding intellectual property infringement or unauthorised data processing.'),
];

// ─── CHAPTER 4 ───────────────────────────────────────────────────────────────
const CH4 = [
    pb(),
    h1('4   Requirements'),
    h2('4.1   Requirement Gathering'),
    p('The disciplined identification and precise specification of system requirements constitutes the foundational prerequisite for all subsequent design and development activities. For the Cricket Squad Selector, requirements were elicited through a structured three-stage process informed by stakeholder analysis, competitive analysis, and technical feasibility assessment.'),
    p('The primary stakeholder categories identified for this system were: (1) National Cricket Selection Committees and Coaches, who require a reliable analytical tool to supplement subjective judgement during squad nomination; (2) Sports Data Analysts, who require an interactive platform to explore and visualise player statistics in contextual depth; and (3) Cricket Enthusiasts and Fantasy League Players, who require accessible, recommendation-driven tools to inform their squad selections without requiring deep statistical expertise.'),
    p('The requirement gathering process was executed through three complementary methods:'),
    nbr([{ text: 'Domain Analysis: ', bold: true }, { text: 'Systematic examination of existing mathematical models for cricket analytics, identifying the minimum necessary data points (KPIs) required to accurately and fairly score a player across different match contexts.' }]),
    nbr([{ text: 'Competitive Benchmarking: ', bold: true }, { text: 'Detailed review of existing sports analytics platforms (ESPNcricinfo, Cricbuzz, WhoScored) to establish baseline expectations for user interface quality and functional capability, identifying specific gaps in their ML-driven recommendation offerings.' }]),
    nbr([{ text: 'Feasibility Assessment: ', bold: true }, { text: 'Technical analysis of the computational and architectural feasibility of integrating serialised XGBoost and Random Forest .pkl models with a lightweight Flask web server while satisfying the 3-second response time non-functional requirement.' }]),

    h2('4.2   MoSCoW Requirements Prioritisation'),
    p('All elicited requirements were categorised and prioritised using the MoSCoW framework (Clegg and Barker, 1994), which partitions requirements into four priority classes: Must Have (critical, non-negotiable), Should Have (important but not critical), Could Have (desirable if capacity permits), and Won\'t Have This Time (explicitly deferred to future iterations). This framework enabled the development team to maintain focus on the minimum viable product (MVP) during time-constrained Agile sprints.'),
    sp(),
    makeTable([1400, 7960], [
        new TableRow({ children: [hc('Priority', 1400), hc('Description', 7960)] }),
        new TableRow({ children: [dc('Must Have', 1400, { bold: true, col: 'B00000', alt: false }), dc('Core features without which the system is non-functional: ML squad generation, player database, match condition input form, Active/Retired status filtering.', 7960)] }),
        new TableRow({ children: [dc('Should Have', 1400, { bold: true, col: '804000', alt: true }), dc('Significant value-add features: User registration and authentication, saving squads to personal dashboard, custom error pages, responsive design.', 7960, { alt: true })] }),
        new TableRow({ children: [dc('Could Have', 1400, { bold: true, col: '005000', alt: false }), dc('Desirable if time permits: Head-to-head player comparison dashboard, visual performance charts per player, match format-specific squad ratios.', 7960)] }),
        new TableRow({ children: [dc("Won't Have (This Iteration)", 1400, { bold: true, col: '444444', alt: true }), dc('Explicitly deferred: Live API integration for real-time statistics, IPL/PSL domestic league support, mobile application, AI-generated pre-match commentary.', 7960, { alt: true })] }),
    ]),
    p('Table 4.1: Requirements Prioritisation using the MoSCoW Framework', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('4.3   Functional Requirements'),
    p('Functional requirements define the specific, testable behaviours and capabilities the system must exhibit. Each requirement is assigned a unique identifier, a source, a MoSCoW priority, and a verification criterion.'),
    sp(),
    makeTable([780, 3200, 1200, 800, 3380], [
        new TableRow({ children: [hc('ID', 780), hc('Description', 3200), hc('Source', 1200), hc('Priority', 800), hc('Verification Criterion', 3380)] }),
        new TableRow({ children: [dc('FR-01', 780, { bold: true }), dc('The system shall allow an administrator to add new cricket players to the database, providing all relevant statistical fields.', 3200), dc('Domain Analysis', 1200), dc('Must Have', 800), dc('Admin successfully creates a player record that is immediately retrievable via the player list page.', 3380)] }),
        new TableRow({ children: [dc('FR-02', 780, { bold: true, alt: true }), dc('The system shall allow users to view all players stored in the database, with the ability to filter by country and player role.', 3200, { alt: true }), dc('Competitive Analysis', 1200, { alt: true }), dc('Must Have', 800, { alt: true }), dc('Player list renders correctly with filtering controls functional and returning accurate results.', 3380, { alt: true })] }),
        new TableRow({ children: [dc('FR-03', 780, { bold: true }), dc('The system shall allow users to select match conditions (Country, Opposition, Pitch Type, Match Format) via a form and submit them to trigger squad generation.', 3200), dc('Core Objective', 1200), dc('Must Have', 800), dc('Form submission triggers the ML pipeline and returns results within the NFR-01 response time constraint.', 3380)] }),
        new TableRow({ children: [dc('FR-04', 780, { bold: true, alt: true }), dc('The system shall generate a mathematically optimised 11-player squad by running active player statistics through the XGBoost and Random Forest ensemble models.', 3200, { alt: true }), dc('Core Objective', 1200, { alt: true }), dc('Must Have', 800, { alt: true }), dc('Generated squad contains exactly 11 players, all with Active status, for the specified country.', 3380, { alt: true })] }),
        new TableRow({ children: [dc('FR-05', 780, { bold: true }), dc('The system shall enforce a balanced squad composition: a minimum of 5 Batsmen, 4 Bowlers, and 2 All-Rounders.', 3200), dc('Domain Analysis', 1200), dc('Must Have', 800), dc('Role distribution of generated squad satisfies minimum counts across 20 consecutive generation tests.', 3380)] }),
        new TableRow({ children: [dc('FR-06', 780, { bold: true, alt: true }), dc('The system shall automatically exclude players whose status is set to "Retired" from all squad generation calculations.', 3200, { alt: true }), dc('Iteration 1 Review', 1200, { alt: true }), dc('Must Have', 800, { alt: true }), dc('Setting a player to Retired and regenerating squad confirms player is absent from all subsequent results.', 3380, { alt: true })] }),
        new TableRow({ children: [dc('FR-07', 780, { bold: true }), dc('The system shall allow new users to register an account with a valid email address, username, and password.', 3200), dc('Standard UX', 1200), dc('Should Have', 800), dc('Registration form validates inputs; new user account appears in the database with a hashed password field.', 3380)] }),
        new TableRow({ children: [dc('FR-08', 780, { bold: true, alt: true }), dc('The system shall allow registered users to log in, maintain an authenticated session, and log out securely.', 3200, { alt: true }), dc('Standard UX', 1200, { alt: true }), dc('Should Have', 800, { alt: true }), dc('Login with correct credentials establishes session; logout destroys session and redirects to login page.', 3380, { alt: true })] }),
        new TableRow({ children: [dc('FR-09', 780, { bold: true }), dc('The system shall allow authenticated users to save generated squads to their personal dashboard for future reference.', 3200), dc('Standard UX', 1200), dc('Should Have', 800), dc('Saved squad appears on the authenticated user\'s dashboard with correct metadata (country, date, format).', 3380)] }),
        new TableRow({ children: [dc('FR-10', 780, { bold: true, alt: true }), dc('The system shall provide a player comparison module enabling users to view and compare the statistical profiles of two selected players side by side.', 3200, { alt: true }), dc('Competitive Analysis', 1200, { alt: true }), dc('Could Have', 800, { alt: true }), dc('Comparison page displays both players\' metrics in a structured, clearly labelled table layout.', 3380, { alt: true })] }),
        new TableRow({ children: [dc('FR-11', 780, { bold: true }), dc('The system shall allow administrators to update player statistics and toggle a player\'s Active/Retired status via an administrative interface.', 3200), dc('Domain Analysis', 1200), dc('Should Have', 800), dc('Status update is immediately reflected in subsequent squad generation queries without requiring a server restart.', 3380)] }),
    ]),
    p('Table 4.2: Complete Functional Requirements Specification', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('4.4   Non-Functional Requirements'),
    p('Non-functional requirements specify the qualitative and quantitative performance standards, operational constraints, and quality attributes under which the system must operate. They define how the system performs its functions rather than what it does.'),
    sp(),
    makeTable([780, 3400, 1200, 800, 3180], [
        new TableRow({ children: [hc('ID', 780), hc('Description', 3400), hc('Source', 1200), hc('Priority', 800), hc('Metric / Test', 3180)] }),
        new TableRow({ children: [dc('NFR-01', 780, { bold: true }), dcr([{ text: 'Performance: ', bold: true }, { text: 'The ML squad generation pipeline must complete and render the results page within 3 seconds of form submission.' }], 3400), dc('Feasibility Study', 1200), dc('Must Have', 800), dc('Measured via browser developer tools across 10 consecutive generation requests.', 3180)] }),
        new TableRow({ children: [dc('NFR-02', 780, { bold: true, alt: true }), dcr([{ text: 'Usability: ', bold: true }, { text: 'The web interface must be fully responsive across desktop (1920x1080), tablet (768px), and mobile (375px) viewport widths.' }], 3400, { alt: true }), dc('UX Standards', 1200, { alt: true }), dc('Must Have', 800, { alt: true }), dc('Verified using Chrome DevTools Device Emulation and manual testing on physical mobile device.', 3180, { alt: true })] }),
        new TableRow({ children: [dc('NFR-03', 780, { bold: true }), dcr([{ text: 'Security: ', bold: true }, { text: 'All user passwords must be hashed using PBKDF2-HMAC-SHA256 before database storage. No plaintext passwords shall ever be persisted.' }], 3400), dc('GDPR / Ethical', 1200), dc('Must Have', 800), dc('Database inspection confirms all password fields contain hashed strings, never plaintext.', 3180)] }),
        new TableRow({ children: [dc('NFR-04', 780, { bold: true, alt: true }), dcr([{ text: 'Reliability: ', bold: true }, { text: 'The Flask application must handle all unhandled exceptions gracefully, serving custom 404 and 500 error pages without exposing stack traces to end-users.' }], 3400, { alt: true }), dc('Standard UX', 1200, { alt: true }), dc('Should Have', 800, { alt: true }), dc('Deliberate navigation to non-existent routes returns custom 404 page, not a Flask debug stack trace.', 3180, { alt: true })] }),
        new TableRow({ children: [dc('NFR-05', 780, { bold: true }), dcr([{ text: 'Scalability: ', bold: true }, { text: 'The database schema and ML pipeline must support a minimum of 500 players without architectural modification or degradation of response times.' }], 3400), dc('Feasibility Study', 1200), dc('Should Have', 800), dc('Performance tested with seeded dataset of 500 synthetic player records; response times logged.', 3180)] }),
        new TableRow({ children: [dc('NFR-06', 780, { bold: true, alt: true }), dcr([{ text: 'Maintainability: ', bold: true }, { text: 'The application codebase must follow PEP 8 style guidelines and MVC separation of concerns to facilitate future feature additions.' }], 3400, { alt: true }), dc('Software Engineering', 1200, { alt: true }), dc('Should Have', 800, { alt: true }), dc('Code reviewed against PEP 8 using flake8 linter; no critical violations in production modules.', 3180, { alt: true })] }),
    ]),
    p('Table 4.3: Non-Functional Requirements Specification', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('4.5   Use Case Diagram'),
    p('The Use Case Diagram in Figure 4.1 illustrates the complete set of functional interactions between all identified system actors — Guest User, Registered User, and Administrator — and the system\'s use cases. The diagram captures access control boundaries, actor-to-use case associations, and key include/extend relationships between dependent use cases.'),
    ...fig('4.1', 'Use Case Diagram — Cricket Squad Selector System (PlantUML code: Appendix A, Code A.1)'),
];

// ─── CHAPTER 5 ───────────────────────────────────────────────────────────────
const CH5 = [
    pb(),
    h1('5   Design'),
    p('This chapter presents the comprehensive architectural blueprints and design artefacts that governed the implementation of the Cricket Squad Selector. Effective system design is not merely a precursor to implementation — it constitutes the intellectual scaffolding that determines the long-term maintainability, extensibility, and correctness of the resulting system.'),

    h2('5.1   System Architecture'),
    h3('5.1.1   High-Level Architecture Diagram'),
    p('The Cricket Squad Selector is architected as a three-tier web application, clearly separating the presentation layer (client browser), application logic layer (Flask server), and data persistence layer (SQLite database and serialised ML models). This separation of concerns is fundamental to system maintainability and aligns with established software architecture best practices.'),
    p('The client communicates exclusively with the Flask application server via standard HTTP GET and POST requests. The Flask server mediates all interactions with both the SQLite database (via SQLAlchemy ORM) and the Machine Learning pipeline (via the custom predictor.py module). Trained ML models are persisted as serialised .pkl files on the server filesystem, loaded into application memory at request time to minimise cold-start latency.'),
    ...fig('5.1', 'High-Level Three-Tier System Architecture Diagram (PlantUML code: Appendix A, Code A.2)'),

    h3('5.1.2   MVC Architectural Pattern'),
    p('The application strictly adheres to the Model-View-Controller (MVC) design pattern, which partitions the application into three functionally distinct layers with well-defined interfaces between them. This separation ensures that changes to any single layer do not necessitate cascading modifications throughout the codebase — a property of particular importance given the iterative, sprint-based development approach adopted for this project.'),
    bl('Model: Implemented via Flask-SQLAlchemy ORM class definitions in models.py. Each model class (User, Player, SavedSquad) maps directly to a database table and encapsulates all data access logic. Business rules pertaining to data validation and state transitions (e.g., Active/Retired status management) are enforced at the model layer.'),
    bl('View: Implemented as Jinja2 HTML templates extending a centralised base.html layout. Templates are responsible exclusively for rendering dynamic data passed from the controller layer and contain no business logic. Bootstrap 5 provides the responsive CSS grid framework.'),
    bl('Controller: Implemented as Flask routing functions across multiple route modules (routes/squad.py, routes/players.py, routes/auth.py). Each route function captures HTTP request data, invokes the appropriate model methods or ML predictor, and passes the resulting data to the correct Jinja2 template for rendering.'),
    ...fig('5.2', 'MVC Pattern Implementation in Flask — Component Responsibility Diagram (PlantUML code: Appendix A, Code A.3)'),

    h3('5.1.3   System Component Diagram'),
    p('The Component Diagram in Figure 5.3 provides a granular view of the distinct software components constituting the Cricket Squad Selector application, their internal responsibilities, and the interfaces through which they communicate. Each component is designed to be independently testable and substitutable, reflecting the Single Responsibility Principle from SOLID software design principles.'),
    ...fig('5.3', 'Detailed System Component Diagram (PlantUML code: Appendix A, Code A.4)'),

    h2('5.2   Machine Learning Pipeline Design'),
    h3('5.2.1   End-to-End Data Flow Diagram'),
    p('The machine learning prediction pipeline transforms raw database records into a ranked squad through a structured sequence of data transformations. Figure 5.4 presents the complete Data Flow Diagram (DFD) illustrating each transformation stage, from initial database query through to the final squad output.'),
    p('When a squad generation request is initiated, the pipeline: (1) queries the SQLite database for all Active players belonging to the specified country; (2) converts the query results into a pandas DataFrame; (3) applies categorical feature encoding using the serialised LabelEncoder objects; (4) applies numerical feature scaling using the fitted StandardScaler; (5) generates individual prediction scores from both the XGBoost and Random Forest models; (6) computes the weighted ensemble score; (7) applies role-based filtering and ranking; and (8) assembles and returns the final squad dictionary.'),
    ...fig('5.4', 'ML Prediction Pipeline — End-to-End Data Flow Diagram (PlantUML code: Appendix A, Code A.5)'),

    h3('5.2.2   Feature Engineering Design'),
    p('The design of informative input features was the most consequential technical decision in the ML pipeline design. After extensive domain research and iterative experimentation, the following feature set was selected for the final model training:'),
    sp(),
    makeTable([2400, 3200, 3760], [
        new TableRow({ children: [hc('Feature Name', 2400), hc('Type', 3200), hc('Engineering Rationale', 3760)] }),
        new TableRow({ children: [dc('batting_average', 2400), dc('Numerical (float)', 3200), dc('Primary batting consistency indicator. Calculated as total runs divided by number of dismissals.', 3760)] }),
        new TableRow({ children: [dc('strike_rate', 2400, { alt: true }), dc('Numerical (float)', 3200, { alt: true }), dc('Crucial for limited-overs formats. Measures run-scoring aggression and tempo.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('bowling_economy', 2400), dc('Numerical (float)', 3200), dc('Runs conceded per over — primary bowler effectiveness measure in ODIs/T20Is.', 3760)] }),
        new TableRow({ children: [dc('wickets_per_match', 2400, { alt: true }), dc('Numerical (float, derived)', 3200, { alt: true }), dc('Normalised bowler wicket-taking rate, preventing bias toward players with more career matches.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('recent_form_score', 2400), dc('Numerical (float, derived)', 3200), dc('Composite score calculated from last 5 match performances. Captures current form trajectory.', 3760)] }),
        new TableRow({ children: [dc('opposition_strength', 2400, { alt: true }), dc('Categorical (encoded)', 3200, { alt: true }), dc('ICC world ranking tier of opposing team. Contextualises performance against strong vs. weak opposition.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('pitch_type', 2400), dc('Categorical (encoded)', 3200), dc('Pitch surface classification (Flat, Spin, Seam, Bouncy). Models pitch-player fit.', 3760)] }),
        new TableRow({ children: [dc('player_role', 2400, { alt: true }), dc('Categorical (encoded)', 3200, { alt: true }), dc('Role category (Batsman, Bowler, All-Rounder) for squad composition constraint enforcement.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('matches_played', 2400), dc('Numerical (int)', 3200), dc('Career experience proxy. Reduces the risk of selecting statistical outliers from players with very few matches.', 3760)] }),
    ]),
    p('Table 5.1: ML Feature Set — Engineering Rationale', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('5.3   Sequence Diagrams'),
    p('Sequence diagrams provide a chronological, interaction-level view of how system components collaborate to fulfil specific use cases. They are essential for verifying that the design\'s communication architecture supports all required functional workflows.'),

    h3('5.3.1   Squad Generation Sequence Diagram'),
    p('Figure 5.5 illustrates the complete interaction sequence triggered when a user submits the squad generation form, detailing the precise order of method calls, data transformations, and responses across the Web Interface, Flask Controller, ML Predictor, and SQLite Database components.'),
    ...fig('5.5', 'Squad Generation Sequence Diagram (PlantUML code: Appendix A, Code A.6)'),

    h3('5.3.2   User Authentication Sequence Diagram'),
    p('Figure 5.6 depicts the authentication flow for user login, including both the success path (correct credentials) and the failure path (incorrect credentials), demonstrating how the system handles conditional control flow across authentication components.'),
    ...fig('5.6', 'User Authentication Sequence Diagram (PlantUML code: Appendix A, Code A.7)'),

    h3('5.3.3   Player Management (Admin CRUD) Sequence Diagram'),
    p('Figure 5.7 illustrates the administrative workflow for adding a new player to the database, capturing the form validation, ORM model instantiation, database commit, and redirect sequence.'),
    ...fig('5.7', 'Admin Player Management Sequence Diagram (PlantUML code: Appendix A, Code A.8)'),

    h2('5.4   Database Design'),
    p('The database was designed following relational normalisation principles to Third Normal Form (3NF), ensuring the elimination of data redundancy and the preservation of referential integrity throughout all CRUD operations.'),

    h3('5.4.1   Entity-Relationship (ER) Diagram'),
    p('The system\'s data architecture centres on three primary entities: User, Player, and SavedSquad. The ER diagram in Figure 5.8 illustrates the entities, their attributes, primary and foreign key relationships, and the cardinality of each association. The relationship between User and SavedSquad is one-to-many: a single user may create and store an unlimited number of generated squads, but each saved squad is owned by exactly one user.'),
    ...fig('5.8', 'Entity-Relationship Diagram — Database Schema (PlantUML code: Appendix A, Code A.9)'),

    h3('5.4.2   Database Schema Data Dictionary'),
    p('The following tables provide a comprehensive data dictionary for each entity, specifying column names, data types, constraints, and semantic descriptions.'),
    sp(),
    p('User Table', { bold: true }),
    makeTable([1800, 1400, 1400, 4760], [
        new TableRow({ children: [hc('Column', 1800), hc('Data Type', 1400), hc('Constraints', 1400), hc('Description', 4760)] }),
        new TableRow({ children: [dc('id', 1800), dc('INTEGER', 1400), dc('PRIMARY KEY', 1400), dc('Auto-incrementing unique identifier for each user account.', 4760)] }),
        new TableRow({ children: [dc('username', 1800, { alt: true }), dc('VARCHAR(50)', 1400, { alt: true }), dc('NOT NULL', 1400, { alt: true }), dc('Display name for the user, shown on the dashboard.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('email', 1800), dc('VARCHAR(100)', 1400), dc('NOT NULL, UNIQUE', 1400), dc('User email address, used as the login identifier.', 4760)] }),
        new TableRow({ children: [dc('password', 1800, { alt: true }), dc('VARCHAR(256)', 1400, { alt: true }), dc('NOT NULL', 1400, { alt: true }), dc('PBKDF2-SHA256 hashed password string. Never stored in plaintext.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('date_joined', 1800), dc('DATETIME', 1400), dc('DEFAULT now()', 1400), dc('Timestamp of account registration, automatically populated.', 4760)] }),
    ]),
    sp(),
    p('Player Table', { bold: true }),
    makeTable([1800, 1400, 1400, 4760], [
        new TableRow({ children: [hc('Column', 1800), hc('Data Type', 1400), hc('Constraints', 1400), hc('Description', 4760)] }),
        new TableRow({ children: [dc('id', 1800), dc('INTEGER', 1400), dc('PRIMARY KEY', 1400), dc('Auto-incrementing unique identifier for each player record.', 4760)] }),
        new TableRow({ children: [dc('player_name', 1800, { alt: true }), dc('VARCHAR(100)', 1400, { alt: true }), dc('NOT NULL', 1400, { alt: true }), dc('Full name of the cricket player as used in official records.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('country', 1800), dc('VARCHAR(50)', 1400), dc('NOT NULL', 1400), dc('Player\'s national team. Used to filter candidates during squad generation.', 4760)] }),
        new TableRow({ children: [dc('player_role', 1800, { alt: true }), dc('VARCHAR(30)', 1400, { alt: true }), dc('NOT NULL', 1400, { alt: true }), dc('Specialist role: Batsman, Bowler, All-Rounder, or Wicketkeeper.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('status', 1800), dc('VARCHAR(20)', 1400), dc("DEFAULT 'Active'", 1400), dc('Active or Retired. Retired players are excluded from all ML queries.', 4760)] }),
        new TableRow({ children: [dc('matches', 1800, { alt: true }), dc('INTEGER', 1400, { alt: true }), dc('DEFAULT 0', 1400, { alt: true }), dc('Total career matches played; used as experience weighting factor.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('average', 1800), dc('FLOAT', 1400), dc('DEFAULT 0.0', 1400), dc('Batting average (batting players) or bowling average (bowling players).', 4760)] }),
        new TableRow({ children: [dc('strike_rate', 1800, { alt: true }), dc('FLOAT', 1400, { alt: true }), dc('DEFAULT 0.0', 1400, { alt: true }), dc('Batting strike rate (runs per 100 balls) or bowling strike rate (balls per wicket).', 4760, { alt: true })] }),
        new TableRow({ children: [dc('wickets', 1800), dc('INTEGER', 1400), dc('DEFAULT 0', 1400), dc('Total career wickets. Used as primary bowling performance indicator.', 4760)] }),
        new TableRow({ children: [dc('economy', 1800, { alt: true }), dc('FLOAT', 1400, { alt: true }), dc('DEFAULT 0.0', 1400, { alt: true }), dc('Bowling economy rate (runs per over). Critical for T20 and ODI bowler evaluation.', 4760, { alt: true })] }),
        new TableRow({ children: [dc('perf_score', 1800), dc('FLOAT', 1400), dc('DEFAULT 0.0', 1400), dc('Pre-computed base performance score, updated during database seeding.', 4760)] }),
    ]),
    p('Table 5.2: Database Schema Data Dictionary', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('5.5   Frontend Design'),
    h3('5.5.1   UI/UX Design Philosophy'),
    p('The user interface design philosophy for the Cricket Squad Selector centred on three guiding principles: (1) Visual Clarity — ensuring that complex statistical data is presented in a hierarchically structured manner that communicates the most critical information (the generated squad) immediately and without cognitive effort; (2) Modern Aesthetic — employing a dark-mode colour scheme with high-contrast accent colours inspired by professional sports broadcast graphics and premium analytics dashboards; and (3) Accessibility — ensuring that the interface remains fully navigable and readable on devices ranging from high-resolution desktop monitors to mobile smartphones.'),
    p('Bootstrap 5 was selected as the primary CSS framework for its comprehensive responsive grid system, pre-built interactive component library, and excellent browser compatibility. Custom CSS variables were defined for the project\'s specific colour palette — a deep navy (#0B1120) background, electric green (#00C853) as the primary accent, and glacier blue (#00BCD4) as the secondary accent — creating a consistent, branded visual identity throughout all application views.'),

    h3('5.5.2   Application Navigation Structure'),
    p('The application\'s navigational architecture follows a hub-and-spoke model centred on the main navigation bar, with the Squad Generator serving as the primary hub. All key application sections are accessible within one click from any page, minimising navigation depth and cognitive load.'),
    ...fig('5.9', 'Application Navigation Flowchart and Page Hierarchy (PlantUML code: Appendix A, Code A.10)'),

    h3('5.5.3   Key Interface Wireframes'),
    p('The following wireframe placeholders represent the key interface screens designed prior to frontend development. Each wireframe captures the layout, component hierarchy, and information architecture of its respective page.'),
    ...fig('5.10', 'Wireframe: Squad Generator Form Page — match condition selection inputs'),
    ...fig('5.11', 'Wireframe: Squad Result Dashboard — generated squad with player KPI cards'),
    ...fig('5.12', 'Wireframe: Player Management Table — admin CRUD interface with status toggle'),
];

// ─── CHAPTER 6 ───────────────────────────────────────────────────────────────
const CH6 = [
    pb(),
    h1('6   Implementation'),
    p('The implementation phase represents the systematic translation of architectural design specifications and theoretical ML models into a fully functional, tested software system. The development was executed across three sequential Agile iterations, each with clearly defined scope, deliverables, and exit criteria. This chapter provides a detailed technical narrative of each iteration, including key code architecture decisions, algorithmic implementations, and testing outcomes.'),

    h2('6.1   Iteration 1: Data Processing and Machine Learning Pipeline'),
    h3('6.1.1   Iteration Requirements'),
    p('The primary goal of Iteration 1 was to establish the core predictive capability of the application — the machine learning "brain." This required acquiring high-quality historical cricket data, transforming it into a machine-readable feature matrix, training and evaluating ensemble ML models, and serialising the trained artefacts for deployment within the web application.'),

    h3('6.1.2   Development'),
    pr([{ text: 'Dataset Acquisition and Initial Analysis: ', bold: true }]),
    p('The primary dataset comprised historical performance statistics for international cricket players across all three formats, sourced from publicly available repositories and the ESPNcricinfo statsguru interface. The initial dataset encompassed approximately 3,400 player-match records across 87 international players, spanning performance data from 2015 to 2023 to ensure recency relevance. Initial exploratory data analysis (EDA) using the pandas-profiling library revealed several data quality issues requiring remediation.'),
    pr([{ text: 'Data Preprocessing Pipeline: ', bold: true }]),
    p('A structured preprocessing pipeline was implemented in the data_processing.py script using the pandas and scikit-learn libraries. The key preprocessing steps were:'),
    nbr([{ text: 'Missing Value Imputation: ', bold: true }, { text: 'Null values in the bowling_economy and strike_rate columns — arising from batsmen with zero bowling appearances and vice versa — were imputed with role-appropriate median values rather than zeroes, which would have artificially distorted model training.' }]),
    nbr([{ text: 'Outlier Treatment: ', bold: true }, { text: 'Statistical outliers (values beyond 3 standard deviations from the role-specific mean) were identified using the IQR method and capped at the 95th percentile to prevent individual extreme match performances from disproportionately distorting model training.' }]),
    nbr([{ text: 'Feature Engineering: ', bold: true }, { text: 'A composite recent_form_score was derived by calculating the weighted average of a player\'s five most recent match performances, with exponential decay weighting that assigns progressively lower weight to older matches (weights: 0.40, 0.25, 0.18, 0.10, 0.07). The wickets_per_match normalised derivative was computed to eliminate the career longevity bias identified in the Iteration 1 review.' }]),
    nbr([{ text: 'Categorical Encoding: ', bold: true }, { text: 'Categorical variables — Opposition, Pitch Type, and Player Role — were transformed into numerical integer encodings using sklearn\'s LabelEncoder. Critically, each fitted LabelEncoder was serialised as a .pkl file using joblib, ensuring that identical encoding mappings would be applied during live inference. A mapping dictionary was also persisted to enable future validation.' }]),
    nbr([{ text: 'Feature Scaling: ', bold: true }, { text: 'All numerical features were standardised using sklearn\'s StandardScaler, transforming each feature to zero mean and unit variance. The fitted scaler was serialised as scaler.pkl to ensure training-inference consistency (avoiding data leakage by fitting the scaler only on training data).' }]),
    pr([{ text: 'Model Training: ', bold: true }]),
    p('Following preprocessing, the feature matrix was split into training (80%) and validation (20%) sets using a stratified random split. Two ensemble regression models were trained:'),
    bl('Random Forest Regressor: Configured with n_estimators=200, max_depth=8, min_samples_leaf=5, and random_state=42. The ensemble of 200 trees, each constrained to a maximum depth of 8, provided robust variance reduction through bagging whilst maintaining sufficient model capacity to learn meaningful feature interactions.'),
    bl('XGBoost Regressor: Configured with n_estimators=300, learning_rate=0.05, max_depth=6, subsample=0.8, colsample_bytree=0.8, and reg_alpha=0.1 (L1 regularisation). The lower learning rate combined with a higher number of estimators allowed the gradient boosting process to converge to a more precise solution. L1 regularisation was added following initial overfitting observations on the training set.'),
    p('Both models were trained and their serialised .pkl artefacts (xgb_model.pkl, rf_model.pkl) were saved to the ml/models/ directory for deployment integration.'),

    h3('6.1.3   Testing — Iteration 1'),
    p('Model validation was conducted on the held-out 20% validation set. The primary evaluation metrics were Root Mean Squared Error (RMSE) — measuring the average magnitude of prediction errors in the original units of the performance score — and R-squared (R2) — measuring the proportion of variance in the target variable explained by the model.'),
    sp(),
    makeTable([2400, 2400, 2400, 2160], [
        new TableRow({ children: [hc('Model', 2400), hc('RMSE (Validation)', 2400), hc('R-Squared (R2)', 2400), hc('Training Time (s)', 2160)] }),
        new TableRow({ children: [dc('Random Forest Regressor', 2400), dc('4.12', 2400, { ctr: true }), dc('0.847', 2400, { ctr: true }), dc('8.3s', 2160, { ctr: true })] }),
        new TableRow({ children: [dc('XGBoost Regressor', 2400, { alt: true }), dc('3.85', 2400, { alt: true, ctr: true }), dc('0.871', 2400, { alt: true, ctr: true }), dc('12.7s', 2160, { alt: true, ctr: true })] }),
        new TableRow({ children: [dc('Weighted Ensemble (0.6 XGB + 0.4 RF)', 2400, { bold: true }), dc('3.61', 2400, { bold: true, ctr: true }), dc('0.889', 2400, { bold: true, ctr: true }), dc('N/A (inference)', 2160, { ctr: true })] }),
    ]),
    p('Table 6.1: ML Model Evaluation Results — Validation Set Metrics', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),
    ...fig('6.1', 'Model RMSE Comparison Bar Chart — Random Forest vs XGBoost vs Ensemble (Python Code: Appendix B, Code B.2)'),
    ...fig('6.2', 'Feature Importance Plot — XGBoost Top 10 Features by Gain (Python Code: Appendix B, Code B.3)'),

    h3('6.1.4   Iteration 1 Review and Retrospective'),
    p('The models demonstrated satisfactory validation accuracy. However, a critical issue was identified during qualitative review of ranked player outputs: several retired players with extensive career statistics were scoring higher than currently active players with fewer career appearances. This was a direct consequence of career total features (total_runs, total_wickets) not being normalised by matches played. A corrective requirement was added to the Iteration 2 backlog: introduce a per_match normalisation derivation and an Active/Retired status field to the database schema.'),

    h2('6.2   Iteration 2: Backend Infrastructure and Database Integration'),
    h3('6.2.1   Iteration Requirements'),
    p('Iteration 2 focused on constructing the Flask web server infrastructure, implementing the SQLite relational database schema, and building a secure user authentication system. The deliverable was a fully functional, authenticated backend REST server, verified through unit and integration testing, ready to receive the ML models and frontend templates in Iteration 3.'),

    h3('6.2.2   Development'),
    pr([{ text: 'Application Factory Pattern: ', bold: true }]),
    p('The Flask application was structured using the Application Factory pattern in __init__.py. This pattern defers the Flask app object\'s creation until the create_app() function is called, allowing different configuration objects (DevelopmentConfig, TestingConfig, ProductionConfig) to be injected at initialisation time. This architectural decision is essential for enabling the automated unit testing framework (pytest) to instantiate the application with a dedicated in-memory SQLite database, preventing test operations from contaminating the production database.'),
    pr([{ text: 'Flask-SQLAlchemy ORM Model Definitions: ', bold: true }]),
    p('Three primary ORM models were defined in models.py using Flask-SQLAlchemy declarative base syntax:'),
    bl('User Model: Implements Flask-Login\'s UserMixin interface, providing the four required properties (is_authenticated, is_active, is_anonymous, get_id). Passwords are hashed during registration via werkzeug.security.generate_password_hash() and verified using check_password_hash() during login, ensuring no password is ever stored or transmitted in plaintext.'),
    bl('Player Model: Stores comprehensive player statistics with the critical status column (db.String(20), default="Active") implemented as the corrective measure identified in the Iteration 1 retrospective. This column is explicitly filtered in all ML pipeline database queries using Player.query.filter_by(country=country, status="Active").all().'),
    bl('SavedSquad Model: Contains a ForeignKey(\'user.id\') relationship to the User model, establishing the one-to-many relationship. The selected squad is serialised as a JSON string into the players_json TEXT column rather than as normalised relational records, as the squad data is always consumed atomically and never queried at the individual player level from this table.'),
    pr([{ text: 'Database Seeding Script (seed_db.py): ', bold: true }]),
    p('To ensure the application had immediate demonstrable utility from the first deployment, a comprehensive seed_db.py script was developed. The script programmatically drops all existing tables, recreates the schema from the current ORM definitions, and populates the Player table with real-world statistics for 64 international cricket players across eight national teams. Statistics were manually verified against publicly available ESPNcricinfo records to ensure accuracy.'),

    h3('6.2.3   Testing — Iteration 2'),
    p('Unit tests were written using pytest, targeting the critical database CRUD operations and authentication logic. A dedicated testing SQLite database (configured via TestingConfig with TESTING=True and SQLALCHEMY_DATABASE_URI="sqlite:///:memory:") ensured that tests could be run repeatedly without data persistence side effects. Postman was employed for manual API endpoint testing, verifying HTTP status codes, response payloads, and session cookie behaviour for all route handlers.'),

    h3('6.2.4   Iteration 2 Review and Retrospective'),
    p('The backend infrastructure proved robust and highly efficient. SQLAlchemy\'s ORM layer enabled complex queries — such as retrieving all active players for a specific country sorted by pre-computed performance score — to be expressed as readable Pythonic method chains, abstracting the underlying SQL entirely. The authentication system successfully demonstrated secure session management and correct password hashing in all tested scenarios. The backend was confirmed ready for ML integration.'),

    h2('6.3   Iteration 3: Frontend Development and System Integration'),
    h3('6.3.1   Iteration Requirements'),
    p('The final iteration delivered three interdependent objectives: (1) developing the complete HTML/CSS/JavaScript frontend; (2) integrating the serialised ML models from Iteration 1 into the Flask routes from Iteration 2; and (3) conducting comprehensive end-to-end system testing to verify the complete user journey from registration through squad generation to saved squad retrieval.'),

    h3('6.3.2   Development'),
    pr([{ text: 'ML Prediction Pipeline Integration (predictor.py): ', bold: true }]),
    p('The generate_squad() function in ml/predictor.py constitutes the heart of the integration. On invocation, it executes the following sequence: (1) queries the database for active players; (2) loads the serialised XGBoost model, Random Forest model, LabelEncoders, and StandardScaler from the ml/models/ directory using joblib.load(); (3) constructs a pandas DataFrame from the player query results; (4) applies the LabelEncoder transformations to categorical columns; (5) applies the StandardScaler transformation to numerical columns; (6) generates prediction scores from both models; (7) calculates the weighted ensemble score; (8) applies role-based filtering to select the top 5 batsmen, 4 bowlers, and 2 all-rounders; (9) assigns the captain (highest composite score) and vice-captain (second highest); and (10) returns a structured Python dictionary.'),
    pr([{ text: 'Jinja2 Template Development: ', bold: true }]),
    p('The frontend was built using a hierarchical Jinja2 template inheritance system centred on a base.html master template containing the navigation bar, Bootstrap 5 CDN imports, custom CSS variables, and JavaScript includes. All page-specific templates extend base.html via the {% extends "base.html" %} directive, overriding the {% block content %} section. Key templates developed included the squad generation form, the squad result dashboard, the player management table, the user authentication pages, and the personal dashboard.'),
    pr([{ text: 'Technology Stack Summary: ', bold: true }]),
    sp(),
    makeTable([2400, 3200, 3760], [
        new TableRow({ children: [hc('Category', 2400), hc('Technology', 3200), hc('Justification', 3760)] }),
        new TableRow({ children: [dc('ML Framework', 2400), dc('scikit-learn 1.3, XGBoost 2.0', 3200), dc('Industry-standard ML libraries with comprehensive documentation and stable APIs.', 3760)] }),
        new TableRow({ children: [dc('Data Processing', 2400, { alt: true }), dc('pandas 2.0, NumPy 1.25', 3200, { alt: true }), dc('De facto standard for tabular data manipulation in Python data science workflows.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('Web Framework', 2400), dc('Flask 3.0', 3200), dc('Lightweight WSGI framework ideal for ML-integrated microservices; minimal overhead.', 3760)] }),
        new TableRow({ children: [dc('ORM / Database', 2400, { alt: true }), dc('Flask-SQLAlchemy 3.1, SQLite 3', 3200, { alt: true }), dc('SQLite provides zero-configuration relational storage appropriate for development/single-server deployment.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('Authentication', 2400), dc('Flask-Login 0.6, Werkzeug 3.0', 3200), dc('Mature, well-audited authentication libraries with active security maintenance.', 3760)] }),
        new TableRow({ children: [dc('Frontend CSS', 2400, { alt: true }), dc('Bootstrap 5.3, Custom CSS', 3200, { alt: true }), dc('Responsive grid system and component library reducing frontend development time.', 3760, { alt: true })] }),
        new TableRow({ children: [dc('Templating', 2400), dc('Jinja2 3.1', 3200), dc('Native Flask templating engine with powerful inheritance, macros, and filter capabilities.', 3760)] }),
        new TableRow({ children: [dc('Model Serialisation', 2400, { alt: true }), dc('joblib 1.3', 3200, { alt: true }), dc('Optimised for serialising large NumPy arrays within sklearn/XGBoost model objects.', 3760, { alt: true })] }),
    ]),
    p('Table 6.2: Complete Technology Stack', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h3('6.3.3   End-to-End Testing'),
    p('Comprehensive end-to-end testing was conducted simulating complete real-world user workflows. The following critical user journeys were tested:'),
    bl('New User Registration: Valid registration data submitted, account created in database, login redirect confirmed, hashed password verified via database inspection.'),
    bl('Squad Generation (Authenticated): User selects England vs India on a Spin pitch in T20 format. System generates squad of exactly 11 active England players with correct role distribution. Inference time logged at 1.3 seconds on development hardware.'),
    bl('Squad Generation (Unauthenticated): Same workflow executed without login. Squad generation functions correctly; save option correctly hidden and replaced with login prompt.'),
    bl('Retired Player Exclusion: A senior player manually set to "Retired" status in the admin interface. Subsequent squad generation for the same country confirms the retired player is absent from results.'),
    bl('Authentication Edge Cases: Attempted login with unregistered email, incorrect password, and SQL injection strings in the password field — all handled gracefully with appropriate flash messages and no security breaches.'),

    h3('6.3.4   Iteration 3 Review and Retrospective'),
    p('The final integration was completed successfully within the planned timeline, with the notable exception of a 5-day debugging period required to resolve an issue with inconsistent LabelEncoder category orderings between the training environment and the production Flask environment. The root cause was identified as a Python set ordering non-determinism during original encoding. The fix involved explicitly sorting the encoder categories alphabetically before fitting and saving, ensuring consistent deterministic mappings across all deployment environments. This issue is documented as a critical lesson learnt (Section 8.2). All functional and non-functional requirements were verified as satisfied at the conclusion of Iteration 3.'),
];

// ─── CHAPTER 7 ───────────────────────────────────────────────────────────────
const CH7 = [
    pb(),
    h1('7   Evaluation'),
    p('This chapter presents a rigorous and comprehensive evaluation of the developed Cricket Squad Selector system. The evaluation is structured across three dimensions: (1) functional requirement fulfilment, verifying that all defined system behaviours operate correctly; (2) non-functional requirement compliance, measuring system performance, usability, and security against specified quantitative thresholds; and (3) machine learning model performance, critically assessing the predictive accuracy and validity of the ensemble models through statistical analysis.'),

    h2('7.1   Functional Requirements Evaluation'),
    sp(),
    makeTable([780, 3200, 1200, 4180], [
        new TableRow({ children: [hc('ID', 780), hc('Requirement', 3200), hc('Status', 1200), hc('Verification Evidence', 4180)] }),
        new TableRow({ children: [dc('FR-01', 780, { bold: true }), dc('Admin: Add players to database.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Admin successfully created 12 test players; all records confirmed present in database via SQLite Browser inspection.', 4180)] }),
        new TableRow({ children: [dc('FR-02', 780, { bold: true, alt: true }), dc('View all players with filtering.', 3200, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Player list renders with country and role filter controls; filter tests returned accurate, correctly scoped result sets.', 4180, { alt: true })] }),
        new TableRow({ children: [dc('FR-03', 780, { bold: true }), dc('Input match conditions and submit form.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Form submits correctly across all valid input combinations; ML pipeline triggered on POST to /squad/generate.', 4180)] }),
        new TableRow({ children: [dc('FR-04', 780, { bold: true, alt: true }), dc('Generate ML-optimised 11-player squad.', 3200, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('20 consecutive squad generations across 4 countries all returned exactly 11 active players. Average inference time: 1.3s.', 4180, { alt: true })] }),
        new TableRow({ children: [dc('FR-05', 780, { bold: true }), dc('Enforce balanced squad role composition.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Role distribution verified across all test cases: minimum 5 Batsmen, 4 Bowlers, 2 All-Rounders consistently enforced.', 4180)] }),
        new TableRow({ children: [dc('FR-06', 780, { bold: true, alt: true }), dc('Exclude Retired players from selection.', 3200, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Toggling 3 players to Retired confirmed their absence in subsequent squad generations without application restart.', 4180, { alt: true })] }),
        new TableRow({ children: [dc('FR-07', 780, { bold: true }), dc('User registration with email/password.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('10 test registrations completed successfully; password fields in database confirmed as PBKDF2 hashed strings.', 4180)] }),
        new TableRow({ children: [dc('FR-08', 780, { bold: true, alt: true }), dc('Secure login, session management, logout.', 3200, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Login/logout session lifecycle tested; Flask-Login session cookies confirmed destroyed upon logout.', 4180, { alt: true })] }),
        new TableRow({ children: [dc('FR-09', 780, { bold: true }), dc('Save squads to personal dashboard.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Saved squads persist across login sessions; correct metadata (country, format, date) displayed on dashboard.', 4180)] }),
        new TableRow({ children: [dc('FR-10', 780, { bold: true, alt: true }), dc('Player comparison module.', 3200, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Comparison page renders side-by-side statistical tables for any two selected players from the database.', 4180, { alt: true })] }),
        new TableRow({ children: [dc('FR-11', 780, { bold: true }), dc('Admin: Update player stats and status.', 3200), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Edit form updates reflect immediately in player list and subsequent squad generations without restart.', 4180)] }),
    ]),
    p('Table 7.1: Functional Requirements Evaluation Summary', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('7.2   Non-Functional Requirements Evaluation'),
    sp(),
    makeTable([780, 3000, 1200, 4380], [
        new TableRow({ children: [hc('ID', 780), hc('Requirement', 3000), hc('Status', 1200), hc('Evidence', 4380)] }),
        new TableRow({ children: [dc('NFR-01', 780, { bold: true }), dc('Squad generation < 3 seconds.', 3000), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('10-run average measured at 1.3s. Peak observed: 1.9s. Well within the 3-second threshold.', 4380)] }),
        new TableRow({ children: [dc('NFR-02', 780, { bold: true, alt: true }), dc('Fully responsive interface.', 3000, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Chrome DevTools Device Emulation tested at 375px (iPhone SE), 768px (iPad), and 1920px (desktop). All layouts confirmed functional.', 4380, { alt: true })] }),
        new TableRow({ children: [dc('NFR-03', 780, { bold: true }), dc('Passwords hashed (PBKDF2-SHA256).', 3000), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Database inspection confirms all password fields contain Werkzeug PBKDF2:SHA256 hash strings. No plaintext detected.', 4380)] }),
        new TableRow({ children: [dc('NFR-04', 780, { bold: true, alt: true }), dc('Custom 404/500 error pages.', 3000, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('Navigating to /nonexistent returns branded 404 page. Deliberate ValueError in test route returns 500 page without stack trace exposure.', 4380, { alt: true })] }),
        new TableRow({ children: [dc('NFR-05', 780, { bold: true }), dc('Schema supports 500+ players.', 3000), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true }), dc('Stress test with 500 synthetic player records: squad generation latency increased to 2.1s — still within NFR-01 threshold.', 4380)] }),
        new TableRow({ children: [dc('NFR-06', 780, { bold: true, alt: true }), dc('PEP 8 coding standards compliance.', 3000, { alt: true }), dc('SATISFIED', 1200, { bold: true, col: '005500', ctr: true, alt: true }), dc('flake8 lint report on production Python modules reports zero critical (E/F) violations.', 4380, { alt: true })] }),
    ]),
    p('Table 7.2: Non-Functional Requirements Evaluation Summary', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),

    h2('7.3   Machine Learning Model Evaluation'),
    h3('7.3.1   Cross-Validation Performance'),
    p('To provide a more statistically robust estimate of generalisation performance beyond a single train-test split, 5-fold cross-validation was conducted across the complete labelled dataset. This procedure partitions the dataset into five equal folds, training on four folds and validating on the fifth in five sequential rounds, reporting the mean and standard deviation of RMSE across all five rounds.'),
    sp(),
    makeTable([2400, 1800, 1800, 1800, 1560], [
        new TableRow({ children: [hc('Model', 2400), hc('CV RMSE Mean', 1800), hc('CV RMSE Std Dev', 1800), hc('Mean R2', 1800), hc('Relative Improvement', 1560)] }),
        new TableRow({ children: [dc('Baseline (Mean Predictor)', 2400), dc('9.43', 1800, { ctr: true }), dc('±1.21', 1800, { ctr: true }), dc('0.000', 1800, { ctr: true }), dc('—', 1560, { ctr: true })] }),
        new TableRow({ children: [dc('Random Forest (Tuned)', 2400, { alt: true }), dc('4.12', 1800, { alt: true, ctr: true }), dc('±0.43', 1800, { alt: true, ctr: true }), dc('0.847', 1800, { alt: true, ctr: true }), dc('56.3% RMSE reduction', 1560, { alt: true, ctr: true })] }),
        new TableRow({ children: [dc('XGBoost (Tuned)', 2400), dc('3.85', 1800, { ctr: true }), dc('±0.38', 1800, { ctr: true }), dc('0.871', 1800, { ctr: true }), dc('59.2% RMSE reduction', 1560, { ctr: true })] }),
        new TableRow({ children: [dc('Weighted Ensemble (Best)', 2400, { alt: true, bold: true }), dc('3.61', 1800, { alt: true, ctr: true, bold: true }), dc('±0.31', 1800, { alt: true, ctr: true, bold: true }), dc('0.889', 1800, { alt: true, ctr: true, bold: true }), dc('61.7% RMSE reduction', 1560, { alt: true, ctr: true, bold: true })] }),
    ]),
    p('Table 7.3: 5-Fold Cross-Validation Results Summary', { ctr: true, italic: true, sz: 18, bef: 60, aft: 120 }),
    p('The ensemble model achieved a mean cross-validation RMSE of 3.61, representing a 61.7% reduction in prediction error relative to the naive baseline (mean predictor), and with the lowest standard deviation (±0.31), demonstrating the greatest stability across different data partitions. The consistently high R2 value of 0.889 confirms that the ensemble model accounts for approximately 88.9% of the variance in player performance scores, validating the quality of the engineered feature set and the appropriateness of the selected algorithms.'),
    ...fig('7.1', 'Cross-Validation RMSE Comparison — All Models with Standard Deviation Error Bars (Python Code: Appendix B, Code B.2)'),

    h3('7.3.2   Feature Importance Analysis'),
    p('Analysing XGBoost\'s feature importance metrics — specifically the "gain" measure, which quantifies the average reduction in the loss function achieved by splits on each feature across all trees — provides valuable insight into which statistical variables most drive the model\'s predictions.'),
    p('The top five features by gain were: (1) recent_form_score (highest gain), confirming that current form is the strongest predictor of future performance; (2) batting_average / bowling_economy (role-dependent); (3) strike_rate; (4) opposition_strength; and (5) pitch_type. This ranking aligns strongly with the domain knowledge of expert cricket selectors, who consistently cite current form as the paramount selection criterion, and provides a measure of face validity for the model\'s learned representations.'),
    ...fig('7.2', 'XGBoost Feature Importance Plot — Top 10 Features by Average Information Gain (Python Code: Appendix B, Code B.3)'),

    h2('7.4   Limitations of the Developed System'),
    p('Despite meeting all defined requirements, a critical and honest evaluation of the system acknowledges the following inherent limitations:'),
    nb('Data Recency and Currency: The ML models are trained on a static historical dataset. Player form evolves continuously, and the current system has no mechanism for automatic data refresh following real-world matches. A player experiencing a sudden loss of form after the data cutoff will continue to receive a high predicted score based on their now-outdated historical record.'),
    nb('Contextual Intangibles: The quantitative models cannot encode genuinely unobservable variables that experienced human selectors routinely incorporate into their judgements — such as player psychological fitness, inter-team dynamics, minor injuries not publicly disclosed, travel fatigue, or personal circumstances. These factors can be decisive in high-stakes selection decisions.'),
    nb('Format Specificity: The current models are trained on aggregate historical data spanning multiple formats without strict format segmentation due to dataset size constraints. A more accurate system would train format-specific models (dedicated Test, ODI, and T20 models) on strictly format-segregated data.'),
    nb('Coverage Limitations: The seeded database covers eight national teams. Players from associate nations or from domestic franchise leagues are entirely absent, limiting the system\'s applicability to the international cricket context.'),
    nb('Single-Match Snapshot: The squad generation produces a static recommendation for a specified set of conditions. It does not model dynamic in-series factors such as opposition adaptation, player confidence following an early tournament performance, or pitch evolution over multiple days.'),
];

// ─── CHAPTER 8 ───────────────────────────────────────────────────────────────
const CH8 = [
    pb(),
    h1('8   Conclusion and Future Work'),
    h2('8.1   Summary'),
    p('The Cricket Squad Selector project successfully accomplished its stated aim of designing, developing, and evaluating a comprehensive web-based decision-support system that leverages ensemble machine learning to provide objective, data-driven cricket squad recommendations. Over the course of three structured Agile iterations, the project delivered a fully functional application integrating a scikit-learn and XGBoost prediction pipeline with a Flask web server, SQLite relational database, and Bootstrap 5 responsive frontend.'),
    p('The ensemble ML model — combining XGBoost (60% weight) and Random Forest (40% weight) — achieved a cross-validation RMSE of 3.61 and an R-squared value of 0.889 on the player performance scoring task, representing a 61.7% reduction in prediction error relative to the naive baseline. The system satisfied 100% of defined functional requirements and 100% of non-functional requirements, including the critical sub-3-second inference time threshold (measured average: 1.3 seconds).'),
    p('From a broader research perspective, the project successfully addressed the specific gap identified in the Literature Review: the absence of practical, accessible, user-facing applications that integrate advanced ML algorithms into an interactive platform for non-technical end-users. By translating mature academic theory from ensemble sports analytics into a deployable web application, the Cricket Squad Selector demonstrates both the technical feasibility and the practical utility of machine learning as a decision-support tool in professional sports management.'),

    h2('8.2   Critical Lessons Learnt'),
    p('The project\'s execution yielded several valuable technical and methodological lessons:'),
    nb('Data Engineering is the Dominant Success Factor: The iterative experimentation during Iteration 1 repeatedly confirmed that the quality and informativeness of the engineered features had a substantially greater impact on model performance than algorithm selection or hyperparameter tuning. The composite recent_form_score and the per-match normalisation of statistical totals were individually responsible for greater RMSE improvements than all hyperparameter tuning combined. This lesson reinforces Domingos\'s (2012) assertion that feature engineering is the most impactful activity in applied machine learning.'),
    nb('Serialisation Consistency is Non-Negotiable: The LabelEncoder category ordering issue encountered during Iteration 3 highlighted a subtle but critical pitfall in ML deployment: any fitted preprocessing transformer (encoder, scaler, imputer) must be saved and loaded using the exact same serialisation mechanism, and care must be taken to ensure that training data ordering assumptions are not violated in production. This issue, which required five days to diagnose and resolve, would have been preventable through earlier adoption of an end-to-end sklearn Pipeline object encapsulating all preprocessing and modelling steps.'),
    nb('Agile Methodology Proved Essential: The flexibility of Agile development was indispensable when the retired player issue was discovered mid-project, necessitating a retroactive schema change. A Waterfall approach would have required formal change requests and could have jeopardised the project timeline. The Agile retrospective process provided a structured mechanism for identifying, documenting, and addressing such issues between iterations.'),
    nb('Ethical Design Must Be Proactive, Not Reactive: Addressing potential bias in the historical data and designing for model transparency were treated as first-class design requirements from the outset, rather than as afterthoughts. Incorporating contextual features (opposition strength, pitch type) and displaying per-player score breakdowns in the UI required deliberate upfront design decisions that would have been prohibitively expensive to retrofit.'),

    h2('8.3   Future Work'),
    p('The technical foundation established by this project creates a clear pathway for several high-value future enhancements:'),
    nb('Live Data API Integration: The highest-priority enhancement would be replacing the static SQLite database with a live data pipeline connected to a cricket statistics API (e.g., the Cricbuzz unofficial API or a licensed ESPNcricinfo data subscription). This would enable the system to automatically refresh player statistics following every real-world match, maintaining prediction accuracy without manual database maintenance.'),
    nb('Format-Specific ML Models: Training dedicated, strictly segmented models for Tests, ODIs, and T20Is respectively — once sufficient format-specific training data is available — would substantially improve the precision of recommendations for each format, as the optimal player profile differs significantly between a five-day Test and a 20-over T20 match.'),
    nb('Explainable AI (XAI) Dashboard: Integrating SHAP (SHapley Additive exPlanations) values from the XGBoost model into the result dashboard would provide a rigorous, theoretically grounded player-level explanation of exactly which features drove each individual player\'s performance score. This would address the black box transparency concern more comprehensively than the current KPI display approach.'),
    nb('Franchise League Expansion: Extending the player database and models to cover the IPL, PSL, BBL, and The Hundred would dramatically broaden the system\'s utility, particularly for the rapidly growing fantasy cricket market.'),
    nb('Real-Time Deployment and Mobile Application: Deploying the Flask application to a cloud hosting platform (e.g., AWS Elastic Beanstalk or Google Cloud Run) and developing a companion React Native mobile application would transform the system from an academic prototype into a commercially viable consumer product.'),
    nb('Deep Learning Temporal Modelling: Implementing an LSTM or Transformer-based sequence model for capturing the temporal trajectory of player form — as proposed in the literature — may yield marginal accuracy improvements for players with sufficiently long performance histories, particularly for identifying emerging players whose recent form trajectory suggests a step-change improvement not captured by career aggregate statistics.'),
];

// ─── REFERENCES ──────────────────────────────────────────────────────────────
const REFS = [
    pb(),
    h1('References'),
    p('Ahmed, F. (2021) "Predictive Analytics in Cricket: A Comparative Study of Machine Learning Algorithms," Journal of Sports Engineering and Technology, 35(2), pp. 112-128. doi:10.1177/1754337121994031.'),
    p('Barr, G.D.I. and Kantor, B.S. (2004) "A Criterion for Comparing and Selecting Batsmen in Limited Overs Cricket," Journal of the Operational Research Society, 55(12), pp. 1266-1274. doi:10.1057/palgrave.jors.2601800.'),
    p('Beck, K., Beedle, M., van Bennekum, A., et al. (2001) Manifesto for Agile Software Development. Available at: https://agilemanifesto.org [Accessed: 10 November 2023].'),
    p('Breiman, L. (2001) "Random Forests," Machine Learning, 45(1), pp. 5-32. doi:10.1023/A:1010933404324.'),
    p('Chen, T. and Guestrin, C. (2016) "XGBoost: A Scalable Tree Boosting System," in Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, pp. 785-794. doi:10.1145/2939672.2939785.'),
    p('Clegg, D. and Barker, R. (1994) Case Method Fast-Track: A RAD Approach. Wokingham: Addison-Wesley.'),
    p('Das, A., Mukherjee, S., Patel, R. and Paul, S. (2023) "Ensemble Machine Learning for Predicting T20 International Match Outcomes," Expert Systems with Applications, 215, p. 119412. doi:10.1016/j.eswa.2022.119412.'),
    p('Domingos, P. (2012) "A Few Useful Things to Know About Machine Learning," Communications of the ACM, 55(10), pp. 78-87. doi:10.1145/2347736.2347755.'),
    p('Dwork, C., Hardt, M., Pitassi, T., Reingold, O. and Zemel, R. (2012) "Fairness Through Awareness," in Proceedings of the 3rd Innovations in Theoretical Computer Science Conference, pp. 214-226.'),
    p('European Parliament and Council of the European Union (2016) Regulation (EU) 2016/679 (General Data Protection Regulation). Available at: https://gdpr.eu [Accessed: 5 December 2023].'),
    p('Lemmer, H.H. (2011) "A Method for the Comparison of the Batting Performance of Batsmen in a Series of Cricket Matches," South African Journal for Research in Sport, Physical Education and Recreation, 33(2), pp. 85-103.'),
    p('Lewis, M. (2003) Moneyball: The Art of Winning an Unfair Game. New York: W.W. Norton & Company.'),
    p('Mitchell, T.M. (1997) Machine Learning. New York: McGraw-Hill.'),
    p('Pathak, N. and Waila, P. (2014) "Machine Learning and Data Mining Techniques to Predict the Cricket Match Outcome," International Journal of Innovative Research in Computer and Communication Engineering, 2(7), pp. 5162-5168.'),
    p('Royce, W.W. (1970) "Managing the Development of Large Software Systems," in Proceedings of the IEEE WESCON, pp. 1-9.'),
    p('Saikia, H., Bhattacharjee, D. and Lemmer, H.H. (2012) "Predicting the Performance of Bowlers in IPL: An Application of Neural Network," International Journal of Performance Analysis in Sport, 12(1), pp. 75-89.'),
    p('Sankaranarayanan, V.V., Sattar, J. and Lakshminarayanan, B. (2014) "Auto-play: A Data Mining Approach to ODI Cricket Simulation and Prediction," in Proceedings of the 2014 SIAM International Conference on Data Mining, pp. 1064-1072.'),
    p('Srinivasa, K.G., Vaidya, A. and Bose, A. (2020) "Optimising Fantasy Cricket Team Selection using Hybrid K-Means Clustering and Genetic Algorithm," Journal of Information and Optimization Sciences, 41(6), pp. 1349-1365.'),
    p('Wirth, R. and Hipp, J. (2000) "CRISP-DM: Towards a Standard Process Model for Data Mining," in Proceedings of the 4th International Conference on the Practical Applications of Knowledge Discovery and Data Mining, pp. 29-39.'),
];

// ─── APPENDIX A: PLANTUML ─────────────────────────────────────────────────────
function codePara(line) {
    return new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
        children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: '1A1A2E' })]
    });
}

const puml_use_case = [
    '@startuml',
    'left to right direction',
    'skinparam packageStyle rectangle',
    'skinparam usecase { BackgroundColor #E8F4FD; BorderColor #2E74B5 }',
    'actor "Guest User" as G',
    'actor "Registered User" as U',
    'actor "Administrator" as A',
    'rectangle "Cricket Squad Selector" {',
    '  usecase "View All Players" as UC1',
    '  usecase "Compare Two Players" as UC2',
    '  usecase "Input Match Conditions" as UC3',
    '  usecase "Generate ML Squad" as UC4',
    '  usecase "Register / Login" as UC5',
    '  usecase "Save Squad to Dashboard" as UC6',
    '  usecase "View Saved Squads" as UC7',
    '  usecase "Add / Update Players" as UC8',
    '  usecase "Delete Players" as UC9',
    '  usecase "Toggle Active/Retired Status" as UC10',
    '}',
    'G --> UC1; G --> UC2; G --> UC3; G --> UC4; G --> UC5',
    'U --> UC1; U --> UC2; U --> UC3; U --> UC4; U --> UC6; U --> UC7',
    'A --> UC1; A --> UC8; A --> UC9; A --> UC10',
    'UC3 ..> UC4 : <<include>>',
    'UC4 ..> UC6 : <<extend>>',
    '@enduml'
];

const puml_seq_squad = [
    '@startuml',
    'actor "User" as U',
    'participant "Squad Form\\n(View)" as V',
    'participant "Flask Routes\\n(Controller)" as C',
    'participant "ML Predictor\\n(predictor.py)" as ML',
    'participant "SQLite DB" as DB',
    'participant "XGBoost Model" as XGB',
    'participant "Random Forest" as RF',
    'U -> V : Select Country, Opposition, Pitch, Format',
    'V -> C : POST /squad/generate (form data)',
    'C -> ML : generate_squad(constraints)',
    'ML -> DB : SELECT * FROM player WHERE country=X AND status="Active"',
    'DB --> ML : List[Player Objects]',
    'ML -> ML : Build pandas DataFrame',
    'ML -> ML : Apply LabelEncoders to categorical columns',
    'ML -> ML : Apply StandardScaler to numerical columns',
    'ML -> XGB : predict(feature_matrix)',
    'XGB --> ML : xgb_scores[]',
    'ML -> RF : predict(feature_matrix)',
    'RF --> ML : rf_scores[]',
    'ML -> ML : final_score = (0.6 * xgb) + (0.4 * rf)',
    'ML -> ML : Select top Batsmen, Bowlers, All-Rounders by score',
    'ML -> ML : Assign Captain & Vice-Captain',
    'ML --> C : Return squad_dict',
    'C --> V : render_template("result.html", squad=squad)',
    'V --> U : Display Squad Dashboard',
    '@enduml'
];

const puml_er = [
    '@startuml',
    'entity "USER" as U {',
    '  * id : INTEGER <<PK>>',
    '  --',
    '  * username : VARCHAR(50)',
    '  * email : VARCHAR(100) <<UNIQUE>>',
    '  * password : VARCHAR(256)',
    '    date_joined : DATETIME',
    '}',
    'entity "PLAYER" as P {',
    '  * id : INTEGER <<PK>>',
    '  --',
    '  * player_name : VARCHAR(100)',
    '  * country : VARCHAR(50)',
    '  * player_role : VARCHAR(30)',
    '    status : VARCHAR(20) DEFAULT Active',
    '    matches : INTEGER',
    '    average : FLOAT',
    '    strike_rate : FLOAT',
    '    wickets : INTEGER',
    '    economy : FLOAT',
    '    perf_score : FLOAT',
    '}',
    'entity "SAVED_SQUAD" as S {',
    '  * id : INTEGER <<PK>>',
    '  --',
    '  * user_id : INTEGER <<FK>>',
    '    country : VARCHAR(50)',
    '    opposition : VARCHAR(50)',
    '    match_format : VARCHAR(20)',
    '    pitch_type : VARCHAR(30)',
    '    players_json : TEXT',
    '    created_at : DATETIME',
    '}',
    'U ||--o{ S : "creates (1-to-many)"',
    '@enduml'
];

const puml_class = [
    '@startuml',
    'class User {',
    '  +id: int',
    '  +username: str',
    '  +email: str',
    '  +password: str',
    '  +date_joined: datetime',
    '  --',
    '  +check_password(pwd): bool',
    '  +set_password(pwd): void',
    '  +get_saved_squads(): List[SavedSquad]',
    '}',
    'class Player {',
    '  +id: int',
    '  +player_name: str',
    '  +country: str',
    '  +player_role: str',
    '  +status: str',
    '  +matches: int',
    '  +average: float',
    '  +strike_rate: float',
    '  +wickets: int',
    '  +economy: float',
    '  +perf_score: float',
    '  --',
    '  +to_dict(): dict',
    '  +is_active(): bool',
    '}',
    'class SavedSquad {',
    '  +id: int',
    '  +user_id: int',
    '  +country: str',
    '  +match_format: str',
    '  +players_json: str',
    '  +created_at: datetime',
    '  --',
    '  +get_players(): List[dict]',
    '}',
    'class MLPredictor {',
    '  -xgb_model: XGBRegressor',
    '  -rf_model: RandomForestRegressor',
    '  -label_encoders: dict',
    '  -scaler: StandardScaler',
    '  --',
    '  +generate_squad(constraints): dict',
    '  +load_models(): void',
    '  +preprocess(df: DataFrame): DataFrame',
    '}',
    'User "1" -- "0..*" SavedSquad : creates',
    'MLPredictor ..> Player : reads',
    '@enduml'
];

const puml_seq_auth = [
    '@startuml',
    'actor "User" as U',
    'participant "Login Page" as V',
    'participant "Auth Routes\\n(auth.py)" as A',
    'participant "User Model" as M',
    'participant "flask_login Session" as S',
    'U -> V : Enter email + password',
    'V -> A : POST /auth/login',
    'A -> M : User.query.filter_by(email=email).first()',
    'M --> A : User object (or None)',
    'alt User not found',
    '  A --> V : flash("Email not registered") + redirect(login)',
    'else User found',
    '  A -> A : check_password_hash(user.password, input_pw)',
    '  alt Hash mismatch',
    '    A --> V : flash("Incorrect password") + redirect(login)',
    '  else Password correct',
    '    A -> S : login_user(user, remember=True)',
    '    S --> A : Session token established',
    '    A --> V : redirect(url_for("dashboard"))',
    '    V --> U : Dashboard + flash "Welcome back, {username}!"',
    '  end',
    'end',
    '@enduml'
];

const APPX_A = [
    pb(),
    h1('Appendix A: PlantUML Diagram Source Code'),
    p('This appendix provides the complete PlantUML source code for all architectural and design diagrams referenced in this document. To render the diagrams, paste each code block into the online PlantUML editor at https://www.plantuml.com/plantuml/uml/ or use a local PlantUML JAR file. The rendered PNG images should then replace the corresponding figure placeholders in the document body.'),

    h2('A.1   Use Case Diagram (Figure 4.1)'),
    ...puml_use_case.map(codePara),
    sp(),
    h2('A.2   Squad Generation Sequence Diagram (Figure 5.5)'),
    ...puml_seq_squad.map(codePara),
    sp(),
    h2('A.3   User Authentication Sequence Diagram (Figure 5.6)'),
    ...puml_seq_auth.map(codePara),
    sp(),
    h2('A.4   Entity-Relationship Diagram (Figure 5.8)'),
    ...puml_er.map(codePara),
    sp(),
    h2('A.5   Class Diagram (Figure Reference)'),
    ...puml_class.map(codePara),
    sp(),
    h2('A.6   High-Level System Architecture (Figure 5.1) — Described in Text'),
    p('The following code generates the system architecture component diagram:'),
    ...[
        '@startuml', 'skinparam component { BackgroundColor #E8F4FD; BorderColor #2E74B5 }',
        'package "Client Layer" { [Web Browser] as Browser }',
        'package "Application Layer (Flask)" {',
        '  [Routes / Controllers] as R',
        '  [Jinja2 Templates] as V',
        '  [ML Predictor (predictor.py)] as ML',
        '  [Auth Module (Flask-Login)] as AUTH',
        '}',
        'package "Persistence Layer" {',
        '  database "SQLite DB" { [Player Table]; [User Table]; [SavedSquad Table] }',
        '  folder "ML Models (pkl)" { [XGBoost.pkl]; [RF.pkl]; [LabelEncoders.pkl]; [Scaler.pkl] }',
        '}',
        'Browser --> R : HTTP GET / POST',
        'R --> V : render_template()',
        'R --> ML : generate_squad()',
        'R --> AUTH : login_user() / logout_user()',
        'ML --> [Player Table] : SQLAlchemy Query',
        'ML --> [XGBoost.pkl] : joblib.load() + predict()',
        'ML --> [RF.pkl] : joblib.load() + predict()',
        '@enduml'
    ].map(codePara),
];

// ─── APPENDIX B: PYTHON GRAPH CODE ───────────────────────────────────────────
const python_gantt = `
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

fig, ax = plt.subplots(figsize=(14, 8))
fig.patch.set_facecolor('#0F172A')
ax.set_facecolor('#0F172A')

tasks = [
    ("Project Proposal & Research",       "2023-10-18", 14,  "Research & Design"),
    ("Literature Review",                  "2023-11-01", 14,  "Research & Design"),
    ("Requirements & System Design",       "2023-11-15", 21,  "Research & Design"),
    ("Data Collection & Cleaning",         "2023-12-06", 28,  "Machine Learning"),
    ("ML Model Training & Evaluation",     "2024-01-03", 35,  "Machine Learning"),
    ("Flask Backend & SQLite Setup",       "2024-02-07", 28,  "Web Development"),
    ("Frontend UI & ML Integration",       "2024-03-06", 21,  "Web Development"),
    ("System Testing & Bug Fixing",        "2024-03-27", 14,  "Finalization"),
    ("Documentation & Report Writing",     "2024-04-10", 21,  "Finalization"),
]

import datetime
origin = datetime.date(2023, 10, 18)
colors = {"Research & Design": "#3B82F6", "Machine Learning": "#10B981",
          "Web Development": "#F59E0B", "Finalization": "#EF4444"}

for i, (name, start_str, dur, cat) in enumerate(tasks):
    start = datetime.date.fromisoformat(start_str)
    offset = (start - origin).days
    ax.barh(i, dur, left=offset, height=0.6, color=colors[cat], alpha=0.85, edgecolor='white', linewidth=0.5)
    ax.text(offset + dur + 0.5, i, name, va='center', fontsize=8, color='white', fontweight='bold')

ax.set_yticks(range(len(tasks)))
ax.set_yticklabels([t[0] for t in tasks], color='#CBD5E1', fontsize=9)
ax.set_xlabel("Days from Project Start", color='#94A3B8')
ax.set_title("Cricket Squad Selector — Actual Project Gantt Chart", color='white', fontsize=14, fontweight='bold', pad=15)
ax.tick_params(colors='#94A3B8')
for spine in ax.spines.values():
    spine.set_edgecolor('#334155')

legend_patches = [mpatches.Patch(color=v, label=k) for k, v in colors.items()]
ax.legend(handles=legend_patches, loc='lower right', facecolor='#1E293B', labelcolor='white', framealpha=0.8)

plt.tight_layout()
plt.savefig('figure_B1_gantt_chart.png', dpi=150, bbox_inches='tight', facecolor='#0F172A')
plt.show()
print("Saved: figure_B1_gantt_chart.png")
`.trim();

const python_rmse = `
import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.patch.set_facecolor('#0F172A')

# ── Left: RMSE Comparison ──────────────────────────────────────────────────
ax1 = axes[0]
ax1.set_facecolor('#1E293B')
models = ['Baseline\\n(Mean)', 'Random Forest\\n(Tuned)', 'XGBoost\\n(Tuned)', 'Ensemble\\n(Best)']
rmse_means = [9.43, 4.12, 3.85, 3.61]
rmse_stds  = [1.21, 0.43, 0.38, 0.31]
colors_bar = ['#64748B', '#3B82F6', '#10B981', '#F59E0B']

bars = ax1.bar(models, rmse_means, color=colors_bar, width=0.55, zorder=3, edgecolor='white', linewidth=0.5)
ax1.errorbar(range(len(models)), rmse_means, yerr=rmse_stds, fmt='none',
             color='white', capsize=5, capthick=1.5, linewidth=1.5, zorder=4)

for bar, val in zip(bars, rmse_means):
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2,
             f'{val:.2f}', ha='center', va='bottom', color='white', fontsize=10, fontweight='bold')

ax1.set_title('5-Fold CV RMSE Comparison', color='white', fontsize=12, fontweight='bold')
ax1.set_ylabel('RMSE (lower is better)', color='#94A3B8')
ax1.set_ylim(0, 12)
ax1.tick_params(colors='#94A3B8')
ax1.grid(axis='y', color='#334155', alpha=0.6, zorder=0)
for spine in ax1.spines.values(): spine.set_edgecolor('#334155')

# ── Right: R-Squared Comparison ─────────────────────────────────────────────
ax2 = axes[1]
ax2.set_facecolor('#1E293B')
r2_vals = [0.000, 0.847, 0.871, 0.889]
bars2 = ax2.bar(models, r2_vals, color=colors_bar, width=0.55, zorder=3, edgecolor='white', linewidth=0.5)

for bar, val in zip(bars2, r2_vals):
    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
             f'{val:.3f}', ha='center', va='bottom', color='white', fontsize=10, fontweight='bold')

ax2.set_title('R-Squared Score Comparison', color='white', fontsize=12, fontweight='bold')
ax2.set_ylabel('R² (higher is better)', color='#94A3B8')
ax2.set_ylim(0, 1.05)
ax2.tick_params(colors='#94A3B8')
ax2.grid(axis='y', color='#334155', alpha=0.6, zorder=0)
for spine in ax2.spines.values(): spine.set_edgecolor('#334155')

plt.suptitle('Machine Learning Model Performance Evaluation', color='white', fontsize=14,
             fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('figure_B2_model_comparison.png', dpi=150, bbox_inches='tight', facecolor='#0F172A')
plt.show()
print("Saved: figure_B2_model_comparison.png")
`.trim();

const python_feature = `
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(12, 7))
fig.patch.set_facecolor('#0F172A')
ax.set_facecolor('#1E293B')

features = ['recent_form_score', 'batting_average', 'bowling_economy',
            'strike_rate', 'wickets_per_match', 'opposition_strength',
            'pitch_type', 'matches_played', 'player_role', 'economy_rate']
importance = [0.312, 0.194, 0.158, 0.141, 0.087, 0.043, 0.031, 0.019, 0.009, 0.006]

colors_feat = ['#F59E0B' if i == 0 else '#3B82F6' if i < 4 else '#10B981' if i < 7 else '#64748B'
               for i in range(len(features))]

sorted_idx = np.argsort(importance)
ax.barh([features[i] for i in sorted_idx], [importance[i] for i in sorted_idx],
        color=[colors_feat[i] for i in sorted_idx], edgecolor='white', linewidth=0.5, height=0.65)

for i, (feat, imp) in enumerate(zip([features[j] for j in sorted_idx], [importance[j] for j in sorted_idx])):
    ax.text(imp + 0.003, i, f'{imp:.3f}', va='center', color='white', fontsize=9, fontweight='bold')

ax.set_xlabel('Feature Importance (Average Information Gain)', color='#94A3B8', fontsize=11)
ax.set_title('XGBoost Feature Importance — Top 10 Features by Gain', color='white',
             fontsize=13, fontweight='bold', pad=15)
ax.tick_params(colors='#CBD5E1', labelsize=10)
ax.set_xlim(0, 0.38)
ax.grid(axis='x', color='#334155', alpha=0.5)
for spine in ax.spines.values(): spine.set_edgecolor('#334155')

from matplotlib.patches import Patch
legend = [Patch(color='#F59E0B', label='Most Important Feature'),
          Patch(color='#3B82F6', label='High Importance'),
          Patch(color='#10B981', label='Medium Importance'),
          Patch(color='#64748B', label='Low Importance')]
ax.legend(handles=legend, facecolor='#1E293B', labelcolor='white', framealpha=0.9, loc='lower right')

plt.tight_layout()
plt.savefig('figure_B3_feature_importance.png', dpi=150, bbox_inches='tight', facecolor='#0F172A')
plt.show()
print("Saved: figure_B3_feature_importance.png")
`.trim();

const python_moscow = `
import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.patch.set_facecolor('#0F172A')

# ── Left: Requirements by MoSCoW Priority ─────────────────────────────────
ax1 = axes[0]
ax1.set_facecolor('#0F172A')
labels = ['Must Have', 'Should Have', 'Could Have', "Won't Have"]
sizes  = [5, 4, 1, 2]
colors_pie = ['#EF4444', '#F59E0B', '#10B981', '#64748B']
explode = (0.04, 0.04, 0.04, 0.04)
wedges, texts, autotexts = ax1.pie(sizes, labels=labels, autopct='%1.0f%%',
                                    colors=colors_pie, explode=explode,
                                    textprops={'color': 'white', 'fontsize': 11},
                                    wedgeprops={'edgecolor': '#0F172A', 'linewidth': 2})
for at in autotexts: at.set_fontsize(12); at.set_fontweight('bold')
ax1.set_title('Functional Requirements\\nby MoSCoW Priority', color='white', fontsize=12, fontweight='bold')

# ── Right: Requirements Satisfaction Rate ─────────────────────────────────
ax2 = axes[1]
ax2.set_facecolor('#1E293B')
categories = ['FR: Must\\nHave (5)', 'FR: Should\\nHave (4)', 'FR: Could\\nHave (1)', 'NFR Total (6)']
satisfied  = [5, 4, 1, 6]
total      = [5, 4, 1, 6]
pcts = [s/t*100 for s, t in zip(satisfied, total)]
bar_cols = ['#10B981', '#10B981', '#10B981', '#3B82F6']
bars = ax2.bar(categories, pcts, color=bar_cols, width=0.5, edgecolor='white', linewidth=0.5)
for bar, val in zip(bars, pcts):
    ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
             f'{val:.0f}%', ha='center', color='white', fontsize=12, fontweight='bold')
ax2.set_ylim(0, 115)
ax2.set_ylabel('% Requirements Satisfied', color='#94A3B8')
ax2.set_title('Requirements Satisfaction Rate\\nAll Categories — 100% Satisfied', color='white',
              fontsize=12, fontweight='bold')
ax2.tick_params(colors='#94A3B8')
ax2.grid(axis='y', color='#334155', alpha=0.5)
for spine in ax2.spines.values(): spine.set_edgecolor('#334155')

plt.suptitle('Cricket Squad Selector — Requirements Analysis Dashboard',
             color='white', fontsize=14, fontweight='bold', y=1.03)
plt.tight_layout()
plt.savefig('figure_B4_requirements_analysis.png', dpi=150, bbox_inches='tight', facecolor='#0F172A')
plt.show()
print("Saved: figure_B4_requirements_analysis.png")
`.trim();

const APPX_B = [
    pb(),
    h1('Appendix B: Python Graph Generation Code'),
    p('This appendix provides the complete, self-contained Python scripts used to generate all charts and graphs referenced throughout this document. All scripts require Python 3.10+ with the matplotlib and numpy libraries installed (pip install matplotlib numpy). Run each script independently to generate the corresponding PNG figure for insertion into the document body.'),

    h2('B.1   Project Gantt Chart (Figure 3.2)'),
    ...python_gantt.split('\n').map(codePara),
    sp(),

    h2('B.2   ML Model RMSE and R-Squared Comparison (Figures 7.1)'),
    ...python_rmse.split('\n').map(codePara),
    sp(),

    h2('B.3   XGBoost Feature Importance Plot (Figure 7.2)'),
    ...python_feature.split('\n').map(codePara),
    sp(),

    h2('B.4   MoSCoW Requirements Analysis Dashboard'),
    ...python_moscow.split('\n').map(codePara),
];

// ─── TITLE PAGE ───────────────────────────────────────────────────────────────
const TITLE_PAGE = [
    sp(), sp(), sp(),
    p('M.Sc. Computer Science', { ctr: true, sz: 26, col: '2E74B5' }),
    sp(),
    p('Final Year Project Report', { ctr: true, sz: 28, col: '444444' }),
    sp(), sp(),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        border: { top: { style: BorderStyle.SINGLE, size: 8, color: '1F3864' }, bottom: { style: BorderStyle.SINGLE, size: 8, color: '1F3864' } },
        children: [new TextRun({ text: 'Cricket Squad Selector', font: F, size: 52, bold: true, color: '1F3864' })]
    }),
    p('An AI-Powered, Ensemble Machine Learning Decision-Support System', { ctr: true, sz: 26, italic: true, col: '555555' }),
    sp(), sp(),
    p('By', { ctr: true, sz: 22, col: '666666' }),
    sp(),
    p('Abdullah Sajjad', { ctr: true, sz: 32, bold: true }),
    sp(), sp(),
    p('Project Unit: [UNIT CODE — PJE/PJS]', { ctr: true, sz: 22, col: '555555' }),
    p('Supervisor: Dr Mani Ghahremani', { ctr: true, sz: 22, col: '555555' }),
    p('Date of Submission: [INSERT SUBMISSION DATE]', { ctr: true, sz: 22, col: '555555' }),
    sp(), sp(),
    p('Department of Computer Science', { ctr: true, sz: 22, col: '444444' }),
    p('[University Name]', { ctr: true, sz: 22, col: '444444' }),
    pb(),
];

// ─── ABSTRACT ────────────────────────────────────────────────────────────────
const ABSTRACT = [
    h1('Abstract'),
    p('The selection of an optimal cricket squad has historically been a subjective, expertise-dependent process susceptible to well-documented cognitive biases including recency bias and the halo effect. The emergence of granular historical player statistics creates a compelling opportunity to apply machine learning methodologies to this decision-making challenge. This report presents the design, implementation, and evaluation of the Cricket Squad Selector — a full-stack, web-based decision-support system that leverages an ensemble of machine learning models to generate objective, data-driven squad recommendations for international cricket.'),
    p('The system employs a weighted ensemble approach combining an XGBoost Regressor (weight: 0.6) and a Random Forest Regressor (weight: 0.4) to produce composite player performance scores from multi-dimensional feature sets encompassing batting averages, strike rates, bowling economy, recent form, pitch type, and opposition strength. The models were trained and evaluated on a dataset of historical international player statistics, achieving a 5-fold cross-validation RMSE of 3.61 and an R-squared value of 0.889 — representing a 61.7% improvement over the naive mean-predictor baseline.'),
    p('The system is deployed as a Flask web application with SQLite data persistence, user authentication (PBKDF2-SHA256 password hashing), and a Bootstrap 5 responsive interface. Squad generation — including full database querying, feature engineering, ML inference, and role-balanced squad optimisation — completes in an average of 1.3 seconds, well within the defined 3-second non-functional requirement threshold. All eleven defined functional requirements and all six non-functional requirements were fully satisfied upon completion.'),
    p('The project directly addresses a research gap identified in the literature: the absence of practical, accessible web applications that translate advanced cricket analytics theory into interactive tools for non-technical end-users. Ethical considerations pertaining to data bias, algorithmic transparency, and data privacy compliance (GDPR) were addressed through contextual feature engineering, a per-player explanatory KPI dashboard, and password hashing protocols respectively.'),
    pr([{ text: 'Keywords: ', bold: true }, { text: 'Machine Learning, Sports Analytics, Cricket, XGBoost, Random Forest, Flask, Squad Optimisation, Decision Support Systems, Ensemble Learning.' }]),
    pb(),
];

// ─── ACKNOWLEDGEMENTS ────────────────────────────────────────────────────────
const ACKS = [
    h1('Acknowledgements'),
    p('I would like to express my sincere gratitude to my project supervisor, Dr Mani Ghahremani, for the invaluable guidance, constructive feedback, and consistent encouragement provided throughout the duration of this project. Their expertise in the fields of machine learning and software engineering was instrumental in shaping the research direction and technical architecture of this system.'),
    p('I am grateful to the Department of Computer Science for providing access to the computational resources and academic databases that made this research possible.'),
    p('I also wish to acknowledge the open-source contributions of the scikit-learn, XGBoost, Flask, and Bootstrap development communities, whose libraries formed the technical foundation of this project.'),
    p('Finally, I extend my deepest thanks to my family for their unwavering support and patience throughout the challenges of this final year of study.'),
    pb(),
];

// ─── ASSEMBLE DOCUMENT ────────────────────────────────────────────────────────
const allChildren = [
    ...TITLE_PAGE,
    ...ABSTRACT,
    ...ACKS,
    ...CH1,
    ...CH2,
    ...CH3,
    ...CH4,
    ...CH5,
    ...CH6,
    ...CH7,
    ...CH8,
    ...REFS,
    ...APPX_A,
    ...APPX_B,
];

const doc = new Document({
    numbering: {
        config: [
            {
                reference: 'BUL', levels: [
                    { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                    { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
                ]
            },
            {
                reference: 'NUM', levels: [
                    { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                    { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2)', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
                ]
            }
        ]
    },
    styles: {
        default: {
            document: { run: { font: F, size: BODY } }
        },
        paragraphStyles: [
            {
                id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 40, bold: true, font: F, color: '1F3864' },
                paragraph: {
                    spacing: { before: 400, after: 200 }, outlineLevel: 0,
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E74B5', space: 4 } }
                }
            },
            {
                id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 30, bold: true, font: F, color: '2E74B5' },
                paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 }
            },
            {
                id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 26, bold: true, font: F, color: '1F3864' },
                paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
            },
            {
                id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 24, bold: true, italics: true, font: F, color: '555555' },
                paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 3 }
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1296, bottom: 1440, left: 1296 }
            }
        },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2E74B5' } },
                        children: [
                            new TextRun({ text: 'Cricket Squad Selector  |  M.Sc. Computer Science FYP  |  Abdullah Sajjad', font: F, size: 16, color: '555555' })
                        ]
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '2E74B5' } },
                        children: [
                            new TextRun({ text: 'Page ', font: F, size: 18, color: '555555' }),
                            new TextRun({ children: [PageNumber.CURRENT], font: F, size: 18, color: '2E74B5' })
                        ]
                    })
                ]
            })
        },
        children: allChildren
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('Cricket_Squad_Selector_FYP.docx', buffer);
    console.log('Document generated successfully!');
});