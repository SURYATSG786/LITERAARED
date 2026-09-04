import { saveLeagueExamToDb } from '../services/db.js';

const EXAMS = {
  bronze: {
    title: 'Bronze League Advancement Exam',
    target_league: 'silver',
    min_score_percent: 70,
    questions: [
      { id: 'b_q1', question: 'Which letter comes first in the alphabet?', options: ['B', 'A', 'Z', 'M'], correct_index: 1, explanation: 'A is the first letter.' },
      { id: 'b_q2', question: 'Select the noun from the list:', options: ['Run', 'Cat', 'Quickly', 'Blue'], correct_index: 1, explanation: 'Cat is a noun.' },
      { id: 'b_q3', question: 'What is the plural of "Dog"?', options: ['Dog', 'Dogs', 'Doges', 'Dogies'], correct_index: 1, explanation: 'Plural of dog is dogs.' },
      { id: 'b_q4', question: 'Which word is an adjective?', options: ['Happy', 'Jump', 'Tree', 'Under'], correct_index: 0, explanation: 'Happy is an adjective.' },
      { id: 'b_q5', question: 'Fill in: "She ___ reading a book."', options: ['am', 'is', 'are', 'be'], correct_index: 1, explanation: 'She is reading.' }
    ]
  },
  silver: {
    title: 'Silver League Advancement Exam',
    target_league: 'gold',
    min_score_percent: 70,
    questions: [
      { id: 's_q1', question: 'Identify the verb in: "The bird flies high."', options: ['bird', 'flies', 'high', 'The'], correct_index: 1, explanation: 'Flies is the action verb.' },
      { id: 's_q2', question: 'Opposite of "Heavy"?', options: ['Light', 'Dark', 'Small', 'Hard'], correct_index: 0, explanation: 'Light is opposite of heavy.' },
      { id: 's_q3', question: 'Choose the correct pronoun: "___ goes to school."', options: ['He', 'Him', 'His', 'Himself'], correct_index: 0, explanation: 'He is subject pronoun.' },
      { id: 's_q4', question: 'Past tense of "Write"?', options: ['Writed', 'Wrote', 'Written', 'Writing'], correct_index: 1, explanation: 'Past tense of write is wrote.' },
      { id: 's_q5', question: 'Which sentence is correct?', options: ['They is happy.', 'They are happy.', 'They am happy.', 'They be happy.'], correct_index: 1, explanation: 'They are happy.' }
    ]
  },
  gold: {
    title: 'Gold League Advancement Exam',
    target_league: 'platinum',
    min_score_percent: 70,
    questions: [
      { id: 'g_q1', question: 'Which word is an adverb?', options: ['Quick', 'Quickly', 'Quicker', 'Quickness'], correct_index: 1, explanation: 'Quickly is an adverb.' },
      { id: 'g_q2', question: 'Synonym of "Courageous"?', options: ['Brave', 'Timid', 'Quiet', 'Weak'], correct_index: 0, explanation: 'Brave means courageous.' },
      { id: 'g_q3', question: 'Identify the conjunction: "I like tea and coffee."', options: ['like', 'tea', 'and', 'coffee'], correct_index: 2, explanation: 'And is a conjunction.' },
      { id: 'g_q4', question: 'Select the complex sentence:', options: ['I ran.', 'Because it rained, we stayed inside.', 'Dogs bark.', 'She sang loudly.'], correct_index: 1, explanation: 'Contains dependent clause.' },
      { id: 'g_q5', question: 'Which word means "very large"?', options: ['Tiny', 'Gigantic', 'Narrow', 'Short'], correct_index: 1, explanation: 'Gigantic means huge.' }
    ]
  },
  platinum: {
    title: 'Platinum League Mastery Exam',
    target_league: 'master',
    min_score_percent: 70,
    questions: [
      { id: 'p_q1', question: 'What figure of speech is "As brave as a lion"?', options: ['Metaphor', 'Simile', 'Personification', 'Hyperbole'], correct_index: 1, explanation: 'Simile uses as/like.' },
      { id: 'p_q2', question: 'Which is an abstract noun?', options: ['Table', 'Freedom', 'River', 'Book'], correct_index: 1, explanation: 'Freedom is abstract.' },
      { id: 'p_q3', question: 'Identify the passive voice sentence:', options: ['The cat chased the mouse.', 'The mouse was chased by the cat.', 'The cat is running.', 'I see a mouse.'], correct_index: 1, explanation: 'Passive voice.' },
      { id: 'p_q4', question: 'Antonym of "Ambiguous"?', options: ['Vague', 'Clear', 'Uncertain', 'Doubtful'], correct_index: 1, explanation: 'Clear means unequivocal.' },
      { id: 'p_q5', question: 'Choose the correct idiom meaning "to reveal a secret":', options: ['Spill the beans', 'Bite the bullet', 'Break a leg', 'Hit the nail'], correct_index: 0, explanation: 'Spill the beans.' }
    ]
  }
};

export function seedLeagueExams() {
  for (const [league, data] of Object.entries(EXAMS)) {
    saveLeagueExamToDb(`exam_${league}_en`, league, 'en', data);
  }
}

seedLeagueExams();
