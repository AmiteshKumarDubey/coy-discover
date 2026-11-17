export interface Profile {
  id: number;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string[];
}

export interface SwipeResult {
  matched: boolean;
  matchedProfile?: Profile;
}
