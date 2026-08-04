export const GCTU_FACULTY_STRUCTURE = [
  {
    name: 'Faculty of Computing and Information Systems',
    departments: [
      'Computer Science',
      'Mobile & Pervasive Computing',
      'Information Technology',
      'Information Systems',
    ],
  },
  {
    name: 'Faculty of Engineering',
    departments: ['Cyber Security'],
  },
  {
    name: 'Faculty of Business',
    departments: ['Business School'],
  },
] as const;

export function getDepartmentsForFaculty(facultyName?: string | null) {
  return GCTU_FACULTY_STRUCTURE.find((faculty) => faculty.name === facultyName)?.departments || [];
}

export function isValidFacultyDepartment(facultyName?: string | null, departmentName?: string | null) {
  const departments = getDepartmentsForFaculty(facultyName) as readonly string[];
  return departments.includes(String(departmentName || ''));
}
