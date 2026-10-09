export type Round = {
  id: string;
  name: string;
  position: number;
};

export type Competitor = {
  id: string;
  round_id: string;
  name: string;
  val1: string;
  val2: string;
  best_num: number | null;
  best_str: string;
};

export type RankedCompetitor = Competitor & { rank: number };
