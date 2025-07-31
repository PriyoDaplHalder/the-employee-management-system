import React from "react";
import EmployeeNoteCard from "./EmployeeNoteCard";

const EmployeeNotesList = ({ notes, canEdit, ...rest }) => (
  <>
    {notes.map((note) => (
      <EmployeeNoteCard key={note.id} note={note} canEdit={canEdit} {...rest} />
    ))}
  </>
);

export default EmployeeNotesList;
