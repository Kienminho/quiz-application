export interface IContest {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status?: string;
  count?: number | 0;
  tnCount?: number;
  tlCount?: number;
}
export interface IUser {
  id: string;
  email: string;
  username: string;
  accessToken: string;
}

export interface IExam {
  id?: number;
  idUser?: number;
  title: string;
  totalMCQuestion: number;
  totalEssayQuestion: number;
  questions: IQuestion[];
  createdAt?: string;
}

export interface IQuestion {
  id?: number;
  title: string;
  lengthLimit?: number | null;
  type: 'MC' | 'Essay'; // Assuming "MC" for multiple choice, "Essay" for essay type questions
  answers?: IAnswer[]; // Optional since essay questions might not have predefined answers
}

export interface IAnswer {
  id?: number;
  answerText: string;
  isCorrect: boolean;
}

export interface ICompetition {
  id?: number;
  name: string;
  rules: string;
  timeStart: string;
  timeEnd: string;
  unitGroupName: string;
  bannerUrl: string;
}

export interface ISetupCompetition {
  testDuration: number;
  testAttempts: number;
  examIds: number[];
}

export interface IListCompetition extends ICompetition {
  id: number;
  unitGroupName: string;
}

export interface ICreateSubUnits {
  unitGroupName: string;
  subUnits: string[];
}

export interface ISubUnit {
  id: number;
  name: string;
}

export interface IOrganizer {
  id?: number;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface IStartCompetition {
  isMix: boolean | null;
  testDuration: number;
  questions: IQuestion[];
}

export interface IStartRequired {
  bannerUrl: string;
  name: string;
  rules: string;
  password: string;
  themeColor: string;
  timeStart: string;
  timeEnd: string;
  testAttempts: number;
  participant: number;
  infoRequire: number[];
}

export interface IParticipant {
  startTime: string;
  finishTime: string;
  fullName?: string;
  email?: string;
  birthday?: string;
  phone?: string;
  CCCD?: string;
  job?: string;
  sex?: string;
  other?: string;
}

export interface IResult {
  questionId: number;
  chosenAnswerId: number;
  typeQuestion: 'MC' | 'ESSAY';
  answerText?: string;
}

export interface ISubmitAnswer {
  participant: IParticipant;
  results: IResult[];
}

export interface IFieldRequired {
  fullName: string;
  email: string;
  birthday: string;
  phone: string;
  CCCD: string;
  job: string;
  sex: string;
  other: string;
}
