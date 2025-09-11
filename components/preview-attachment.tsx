import type { Attachment } from 'ai';
import { 
  FileIcon, 
  FileTextIcon, 
  ImageIcon, 
  VideoIcon, 
  MusicIcon, 
  ArchiveIcon,
  CodeIcon,
  FileSpreadsheetIcon,
  PresentationIcon
} from 'lucide-react';

import { LoaderIcon } from './icons';

const getFileIcon = (contentType: string, fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (contentType.startsWith('image/')) {
    return <ImageIcon size={20} className="text-blue-500" />;
  }
  
  if (contentType.startsWith('video/')) {
    return <VideoIcon size={20} className="text-purple-500" />;
  }
  
  if (contentType.startsWith('audio/')) {
    return <MusicIcon size={20} className="text-green-500" />;
  }
  
  if (contentType.includes('pdf')) {
    return <FileTextIcon size={20} className="text-red-500" />;
  }
  
  if (contentType.includes('spreadsheet') || contentType.includes('excel') || 
      ['xlsx', 'xls', 'csv'].includes(extension || '')) {
    return <FileSpreadsheetIcon size={20} className="text-green-600" />;
  }
  
  if (contentType.includes('presentation') || contentType.includes('powerpoint') ||
      ['ppt', 'pptx'].includes(extension || '')) {
    return <PresentationIcon size={20} className="text-orange-500" />;
  }
  
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z') ||
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
    return <ArchiveIcon size={20} className="text-yellow-500" />;
  }
  
  if (contentType.includes('text') || contentType.includes('document') ||
      ['txt', 'doc', 'docx', 'rtf'].includes(extension || '')) {
    return <FileTextIcon size={20} className="text-blue-600" />;
  }
  
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(extension || '')) {
    return <CodeIcon size={20} className="text-gray-600" />;
  }
  
  return <FileIcon size={20} className="text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;
  const isImage = contentType?.startsWith('image/');

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center overflow-hidden">
        {isImage ? (
          // NOTE: it is recommended to use next/image for images
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            {getFileIcon(contentType || '', name || '')}
            <span className="text-xs text-muted-foreground text-center px-1">
              {name?.split('.').pop()?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate" title={name}>
        {name}
      </div>
    </div>
  );
};
