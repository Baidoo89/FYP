import { ScholarlyOutputType } from '@prisma/client';
import { z } from 'zod';

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().nullable();
const optionalUrl = z.union([z.literal(''), z.string().trim().url().max(1000)]).optional().nullable();
const optionalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().nullable();

export const academicDossierProfileSchema = z.object({
  orcid: optionalText(50),
  googleScholarUrl: optionalUrl,
  teachingStatement: optionalText(5000),
  researchStatement: optionalText(5000),
  serviceStatement: optionalText(5000),
  applicantDeclaration: z.boolean().default(false),
});

export const scholarlyOutputSchema = z.object({
  type: z.nativeEnum(ScholarlyOutputType),
  title: z.string().trim().min(3).max(500),
  citation: z.string().trim().min(5).max(3000),
  abstract: optionalText(5000),
  publicationDate: optionalDate,
  doi: optionalText(300),
  url: optionalUrl,
  issn: optionalText(50),
  isbn: optionalText(50),
  journalOrPublisher: optionalText(500),
  volumeIssuePages: optionalText(300),
  indexingSource: optionalText(500),
  authors: z.array(z.string().trim().min(1).max(300)).min(1).max(100),
  applicantAuthorPosition: z.number().int().positive().max(100).optional().nullable(),
  contributionStatement: z.string().trim().min(10).max(3000),
  isRefereed: z.boolean().default(false),
  isIndexed: z.boolean().default(false),
  claimedForCurrentRoute: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.applicantAuthorPosition && value.applicantAuthorPosition > value.authors.length) {
    context.addIssue({
      code: 'custom',
      path: ['applicantAuthorPosition'],
      message: 'Author position cannot exceed the number of listed authors.',
    });
  }
  if (value.isIndexed && !String(value.indexingSource || '').trim()) {
    context.addIssue({ code: 'custom', path: ['indexingSource'], message: 'Record the indexing source for an indexed output.' });
  }
  if (![value.doi, value.url, value.issn, value.isbn, value.journalOrPublisher].some((item) => String(item || '').trim())) {
    context.addIssue({
      code: 'custom',
      path: ['journalOrPublisher'],
      message: 'Provide a DOI, URL, ISSN/ISBN, or journal/publisher reference.',
    });
  }
});

export const bestNSelectionSchema = z.object({
  outputIds: z.array(z.number().int().positive()).max(30),
});
