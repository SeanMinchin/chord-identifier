import { Frets, getAllChordsFromNotes, getAllChordsFromFretboard } from './chordIdentifier'
import { Pitch, Octave, Note, createNoteFromName } from './music';
import { TuningName, StringNotes, guitarTunings, FretNumber, TuningOffset, getNoteFromFret } from './fretboard';

export {
    Frets, getAllChordsFromNotes, getAllChordsFromFretboard,
    Pitch, Octave, Note, createNoteFromName,
    TuningName, StringNotes, guitarTunings, FretNumber, TuningOffset, getNoteFromFret
};

console.log(getAllChordsFromFretboard(TuningName.Standard, [false, 7, 5, 6, 5, 5]));