import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const groups = [
  {
    region: 'brains',
    questions: [
      'How does the brain represent uncertainty without carrying a full probability distribution?',
      'How can local synaptic learning rules produce coordinated behavior across an entire brain?',
      'Why do biological brains learn useful representations from so few examples?',
      'How does a neural system decide whether to act now or gather one more observation?',
      'What computational role does sleep play in learning, abstraction, and forgetting?',
      'How are memories reorganized as they move from recent experience to long-term knowledge?',
      'How do neuromodulators switch the brain between exploration, exploitation, and rest?',
      'How can recurrent neural circuits remain stable while still adapting to new environments?',
      'What makes a neural representation compositional rather than merely associative?',
      'How do developing brains acquire useful priors before they have much experience?',
      'Which ecological constraints make efficient neural codes useful?',
      'How are abstract goals translated into robust actions under noisy sensory input?',
      'How does the brain distinguish genuinely new evidence from familiar noise?',
      'What lets one neural system learn simultaneously across milliseconds, days, and years?',
      'When does forgetting improve intelligence rather than diminish it?'
    ]
  },
  {
    region: 'classrooms',
    questions: [
      'What kinds of feedback produce durable learning rather than short-term correction?',
      'How can assessment reveal a student’s reasoning instead of only whether the final answer is right?',
      'When does struggle become productive, and when does it simply become discouraging?',
      'How should learning tools preserve student agency while still offering meaningful guidance?',
      'What helps learners transfer an idea from one context to a genuinely different one?',
      'How can teachers detect misconceptions early without constantly testing students?',
      'How does explaining an idea to a peer change one’s own understanding?',
      'What should mastery mean when tools can perform many component skills on demand?',
      'How should curricula adapt when students arrive with very different prior knowledge?',
      'Which classroom routines best develop metacognition and intellectual independence?',
      'How can multilingual instruction treat language difference as an asset rather than a deficit?',
      'What makes learners appropriately trust—or challenge—feedback from an AI system?',
      'How can schools recognize curiosity and growth without turning them into hollow metrics?',
      'When should an AI tutor answer a question, ask another question, or remain silent?',
      'How can teacher expertise scale without standardizing away professional judgment?'
    ]
  },
  {
    region: 'markets',
    questions: [
      'How should scarce expert attention be allocated when ability to pay and need point in different directions?',
      'What market designs make truthful information more rewarding than persuasive misinformation?',
      'How can platforms internalize the social costs created by engagement-maximizing algorithms?',
      'Who should capture the value created when many people’s data trains one shared model?',
      'How should scarce compute be allocated among private profit, public research, and social need?',
      'When can prediction markets aggregate dispersed knowledge better than committees or polls?',
      'What makes a reputation system resistant to gaming, collusion, and inherited advantage?',
      'When do network effects transform a useful platform into an extractive monopoly?',
      'How should autonomous AI agents negotiate, contract, and bear responsibility for mistakes?',
      'What mechanisms could prevent tacit collusion among pricing algorithms?',
      'How can public goods be funded when their benefits are diffuse and difficult to measure?',
      'When does personalized pricing improve access, and when does it become exploitation?',
      'How should labor markets signal skill when AI changes which credentials remain informative?',
      'What policies preserve meaningful competition when frontier models require enormous fixed costs?',
      'How can matching systems balance efficiency, fairness, and freedom of choice?'
    ]
  },
  {
    region: 'brains-classrooms',
    questions: [
      'Can models of memory consolidation determine when a learner should revisit an idea?',
      'How should teaching adapt to neural variability without reducing students to cognitive profiles?',
      'Can cognitive-load theory help AI explanations reveal structure without removing productive effort?',
      'What observable signals distinguish curiosity from confusion, and how should a teacher respond?',
      'How might sleep and circadian rhythms inform the design of school schedules?',
      'Could lessons be sequenced to alternate acquisition, consolidation, and creative recombination?',
      'When does embodied interaction produce concepts that screen-based learning cannot?',
      'How can confidence judgments train students to calibrate what they know and do not know?',
      'Does feedback work best when it coincides with a neural prediction error or after reflection?',
      'How does the brain’s social-learning machinery change what students learn from peers?',
      'How do bilingual learners organize concepts across languages, and what should instruction do differently?',
      'Can attention be measured usefully in a classroom without becoming surveillance?',
      'When should students retrieve an answer from memory, and when should they generate a new approach?',
      'Could hippocampal replay inspire curricula that revisit ideas in unexpectedly connected contexts?',
      'How should classrooms adapt when stress changes memory, attention, and willingness to explore?'
    ]
  },
  {
    region: 'brains-markets',
    questions: [
      'Can neural computations of information value improve how economic agents decide what to learn next?',
      'What changes when attention is modeled as both a cognitive bottleneck and a scarce economic resource?',
      'How should markets be designed for people whose rationality is bounded, adaptive, and context-dependent?',
      'Are neuromodulatory control systems a useful model for dynamically pricing exploration and risk?',
      'What can reward-prediction errors teach us about bubbles, momentum, and changing expectations?',
      'How does cognitive scarcity alter the welfare consequences of complex choices?',
      'Can exploration–exploitation algorithms account for the social value of trying neglected options?',
      'How are preferences formed by experience, and when should markets treat them as endogenous?',
      'When do social-learning mechanisms turn individual signals into collective information cascades?',
      'What neural mechanisms support trust, and how do institutions amplify or erode them?',
      'How do metabolic and computational budgets shape decisions that look irrational from the outside?',
      'How should engagement markets be governed when they can learn and exploit reward circuitry?',
      'Under what conditions can many bounded minds produce reliable collective intelligence?',
      'How should subjective uncertainty influence risk-sharing, insurance, and the price of information?',
      'Can mechanism design work with biologically plausible learners rather than perfectly rational agents?'
    ]
  },
  {
    region: 'classrooms-markets',
    questions: [
      'How should unanswered teacher questions be routed when expert attention is scarce?',
      'What allocation rule would direct limited tutoring hours toward both need and likely benefit?',
      'Which school-funding incentives improve learning without encouraging metric manipulation?',
      'How will credentials signal knowledge when AI makes polished output cheap?',
      'Could subscription-based AI tutors widen learning gaps even when the underlying model is widely available?',
      'How should teacher labor change when planning, grading, and explanation can be partly automated?',
      'What institutions can sustain open educational resources as durable public goods?',
      'How can admissions matching respect student preferences without reproducing unequal information?',
      'Could peer tutoring exchanges reward contribution without turning every act of help into a transaction?',
      'When does outcomes-based education funding motivate improvement, and when does it invite gaming?',
      'How should schools evaluate AI platforms when vendors know more than buyers about system quality?',
      'Who should control the data produced through a student’s learning?',
      'When do performance bonuses motivate teachers, and when do they crowd out professional purpose?',
      'How can families make meaningful school choices when quality is uncertain and multidimensional?',
      'What matching systems could bring scarce specialist expertise to rural and under-resourced classrooms?'
    ]
  },
  {
    region: 'center',
    questions: [
      'How should an AI tutor allocate attention using uncertainty, learning science, and equity at the same time?',
      'Can we measure learning well enough to personalize support without turning education into surveillance?',
      'What institutions would help human–AI groups become collectively intelligent rather than collectively overconfident?',
      'How can we design incentives that reward curiosity when its benefits are delayed and difficult to measure?',
      'Whose goals should an adaptive learning system optimize: the student’s, the teacher’s, or society’s?',
      'Could a market for expert feedback respect cognitive limits while remaining accessible to those with little money?',
      'How can institutions learn from experience without forgetting the people poorly served by past decisions?',
      'What would an economy look like if human attention—not money—were treated as the central scarce resource?',
      'When personalized learning systems shape preferences, who is responsible for the preferences that emerge?',
      'How will AI metacognition change education, hiring, and the value of knowing what one does not know?',
      'How do feedback loops between algorithms, cognition, and opportunity create durable advantage or disadvantage?',
      'How should AI assistance be rationed when compute, teacher time, and human attention are all limited?',
      'What is the best way for intelligent systems and institutions to communicate uncertainty to people making decisions?',
      'Can we build schools, models, and markets that revise their beliefs without losing their values?',
      'How should long-term human development be valued when short-term engagement is easier to observe and monetize?'
    ]
  }
];

function fract(value) {
  return value - Math.floor(value);
}

function weightsFor(region, index, count) {
  if (region === 'center') {
    if (index === 0) return [1 / 3, 1 / 3, 1 / 3];
    const offsets = [
      [0.08, -0.04, -0.04], [-0.04, 0.08, -0.04], [-0.04, -0.04, 0.08],
      [0.11, -0.08, -0.03], [-0.08, 0.11, -0.03], [-0.03, -0.08, 0.11],
      [0.06, 0.03, -0.09], [0.03, -0.09, 0.06], [-0.09, 0.06, 0.03],
      [0.13, -0.02, -0.11], [-0.11, 0.13, -0.02], [-0.02, -0.11, 0.13],
      [0.07, -0.12, 0.05], [-0.12, 0.05, 0.07]
    ];
    return offsets[index - 1].map((offset) => 1 / 3 + offset);
  }

  const parts = region.split('-');
  const order = ['brains', 'classrooms', 'markets'];
  if (parts.length === 1) {
    if (index === 0) return order.map((name) => name === region ? 1 : 0);
    const spill = 0.04 + 0.28 * (index / (count - 1));
    const ratio = 0.10 + 0.80 * fract(index * 0.61803398875);
    const weights = [0, 0, 0];
    const anchor = order.indexOf(region);
    const others = [0, 1, 2].filter((item) => item !== anchor);
    weights[anchor] = 1 - spill;
    weights[others[0]] = spill * ratio;
    weights[others[1]] = spill * (1 - ratio);
    return weights;
  }

  const thirdName = order.find((name) => !parts.includes(name));
  const third = 0.02 + 0.16 * fract((index + 1) * 0.41421356237);
  const balance = 0.26 + 0.48 * fract((index + 1) * 0.61803398875);
  const weights = [0, 0, 0];
  weights[order.indexOf(parts[0])] = (1 - third) * balance;
  weights[order.indexOf(parts[1])] = (1 - third) * (1 - balance);
  weights[order.indexOf(thirdName)] = third;
  return weights;
}

function roundedWeights(values) {
  const rounded = values.map((value) => Math.round(value * 1000) / 1000);
  rounded[2] = Math.round((1 - rounded[0] - rounded[1]) * 1000) / 1000;
  return rounded;
}

const questions = groups.flatMap((group) => group.questions.map((question, index) => ({
  id: `${group.region}-${String(index + 1).padStart(2, '0')}`,
  question,
  region: group.region,
  weights: roundedWeights(weightsFor(group.region, index, group.questions.length))
})));

const output = path.resolve('data/questions.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  dimensions: ['brains', 'classrooms', 'markets'],
  questions
}, null, 2)}\n`);
console.log(`Wrote ${questions.length} questions to ${output}`);
