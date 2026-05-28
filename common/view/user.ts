import { Allergy, Medical, Symptom } from '../model';

export default interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    allergies?: Allergy[];
    medicalConditions?: Medical[];
    symptoms?: Symptom[];
}
