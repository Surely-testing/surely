// ============================================
// components/documents/DocumentsList.tsx
// ============================================
'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableRow,
  TableGrid,
  TableCell,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Trash } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  file_type?: string;
  created_at: string;
  creator?: {
    name: string;
  };
}

interface DocumentsListProps {
  documents: Document[];
  suiteId: string;
}

export function DocumentsList({ documents, suiteId }: DocumentsListProps) {
  const getFileIcon = (fileType?: string) => {
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  return (
    <Table>
      {documents.map((doc) => (
        <TableRow key={doc.id}>
          <TableGrid columns={3}>
            <TableCell className="col-span-1">
              <div className="flex items-center gap-3">
                {getFileIcon(doc.file_type)}
                <div className="min-w-0">
                  <TableHeaderText>{doc.title}</TableHeaderText>
                  <TableDescriptionText>
                    {doc.file_type || 'Document'} • {doc.creator?.name}
                  </TableDescriptionText>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <TableDescriptionText>
                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
              </TableDescriptionText>
            </TableCell>

            <TableCell className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </TableCell>
          </TableGrid>
        </TableRow>
      ))}
    </Table>
  );
}