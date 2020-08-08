import  { Pitch, Note, Octave } from '../music'

export enum TuningName {
    Standard,
    Drop_D,
    Double_Drop_D,
    Open_G
}
export type StringNotes = [Note, Note, Note, Note, Note, Note];

export const guitarTunings = (): Map<TuningName, StringNotes> => {
    const { C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B } = Pitch;
    const { Standard, Drop_D, Double_Drop_D, Open_G } = TuningName;

    const D2 = new Note(D, 2);
    const E2 = new Note(E, 2);
    const G2 = new Note(G, 2);
    const A2 = new Note(A, 2);
    const D3 = new Note(D, 3);
    const G3 = new Note(G, 3);
    const B3 = new Note(B, 3);
    const D4 = new Note(D, 4);
    const E4 = new Note(E, 4);

    return new Map([
        [Standard, [E2, A2, D3, G3, B3, E4]],
        [Drop_D, [D2, A2, D3, G3, B3, E4]],
        [Double_Drop_D, [D2, A2, D3, G3, B3, E4]],
        [Open_G, [D2, G2, D3, G3, B3, D4]],
    ]);
}

export type FretNumber = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24;
export type TuningOffset = -4|-3|-2|-1|0|1|2|3|4;

export const getNoteFromFret = (string: Note, fret: FretNumber, tuningOffset: TuningOffset = 0): Note => {
    let resultantPitch = string.pitch + fret + tuningOffset;
    if(resultantPitch < 0) resultantPitch += 12;

    const octaveOffest = <Octave>Math.floor(resultantPitch / 12);
    const actualPitch = <Pitch>(resultantPitch % 12);
    
    const newOctave = <Octave>(string.octave + octaveOffest);
  
    return new Note(actualPitch, newOctave);
}
