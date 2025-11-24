export type TemplateFile = {
  path: string; // relative path inside the new folder
  content?: string; // initial file content
};

export type TemplateDef = {
  name: string;
  description?: string;
  files: TemplateFile[];
};

export type WorkspaceTemplates = {
  templates: TemplateDef[];
};
