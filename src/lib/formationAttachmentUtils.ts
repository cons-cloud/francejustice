export interface FormationAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  size: string;
  dataUrl: string;
  created_at: string;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const convertFileToAttachment = (file: File): Promise<FormationAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      resolve({
        id: 'att_' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        size: formatFileSize(file.size),
        dataUrl: result,
        created_at: new Date().toISOString()
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const exportAttachmentFile = (att: FormationAttachment) => {
  try {
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name || (att.type === 'pdf' ? 'document_formation.pdf' : 'image_formation.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export error:", err);
  }
};

export const exportAllAttachments = (attachments: FormationAttachment[]) => {
  if (!attachments || attachments.length === 0) return;
  attachments.forEach((att, index) => {
    setTimeout(() => {
      exportAttachmentFile(att);
    }, index * 300);
  });
};
