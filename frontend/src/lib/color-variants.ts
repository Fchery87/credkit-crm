export type BrandColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'destructive' | 'muted';

export const textColor: Record<BrandColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
};

export const bgTint: Record<BrandColor, string> = {
  primary: 'bg-primary/10',
  secondary: 'bg-secondary/10',
  accent: 'bg-accent/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  info: 'bg-info/10',
  destructive: 'bg-destructive/10',
  muted: 'bg-muted',
};

export const hoverBgTintGroup: Record<BrandColor, string> = {
  primary: 'group-hover:bg-primary/20',
  secondary: 'group-hover:bg-secondary/20',
  accent: 'group-hover:bg-accent/20',
  success: 'group-hover:bg-success/20',
  warning: 'group-hover:bg-warning/20',
  info: 'group-hover:bg-info/20',
  destructive: 'group-hover:bg-destructive/20',
  muted: 'group-hover:bg-muted/60',
};

export const bgSolid: Record<BrandColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
  muted: 'bg-muted',
};