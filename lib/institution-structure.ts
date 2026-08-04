export const GCTU_FACULTY_STRUCTURE = [
  {
    name: 'Faculty of Computing and Information Systems',
    departments: [
      'Mobile & Pervasive Computing',
      'Information Systems',
      'Computer Science',
      'Information Technology',
      'General Studies',
    ],
  },
  {
    name: 'Faculty of Engineering',
    departments: [
      'Electrical and Electronics Engineering',
      'Computer Engineering',
      'Telecommunications Engineering',
      'Mathematics and Statistics',
    ],
  },
  {
    name: 'GCTU Business School',
    departments: [
      'Procurement, Logistics and Supply Chain Management',
      'Management Studies',
      'Accounting, Banking and Finance',
      'Marketing',
      'Economics',
    ],
  },
] as const;

export function getDepartmentsForFaculty(facultyName?: string | null) {
  return GCTU_FACULTY_STRUCTURE.find((faculty) => faculty.name === facultyName)?.departments || [];
}

export function isValidFacultyDepartment(facultyName?: string | null, departmentName?: string | null) {
  const departments = getDepartmentsForFaculty(facultyName) as readonly string[];
  return departments.includes(String(departmentName || ''));
}
