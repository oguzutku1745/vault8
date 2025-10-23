// Type declarations for custom elements and modules

declare module '@reown/appkit/react' {
  export function createAppKit(config: any): any;
  export * from '@reown/appkit/react';
}

declare module '@/components/theme-provider' {
  import { ComponentProps } from 'react';
  
  export interface ThemeProviderProps extends ComponentProps<'div'> {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
  }
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
}

declare module '@/components/ui/button' {
  import { ComponentProps } from 'react';
  
  export interface ButtonProps extends ComponentProps<'button'> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
  
  export const Button: React.ForwardRefExoticComponent<ButtonProps>;
}

declare module '@/components/ui/card' {
  import { ComponentProps } from 'react';
  
  export const Card: React.ForwardRefExoticComponent<ComponentProps<'div'>>;
  export const CardHeader: React.ForwardRefExoticComponent<ComponentProps<'div'>>;
  export const CardFooter: React.ForwardRefExoticComponent<ComponentProps<'div'>>;
  export const CardTitle: React.ForwardRefExoticComponent<ComponentProps<'h3'>>;
  export const CardDescription: React.ForwardRefExoticComponent<ComponentProps<'p'>>;
  export const CardContent: React.ForwardRefExoticComponent<ComponentProps<'div'>>;
}

declare module '@/components/ui/badge' {
  import { ComponentProps } from 'react';
  
  export interface BadgeProps extends ComponentProps<'div'> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }
  
  export function Badge(props: BadgeProps): JSX.Element;
}

declare module '@/components/header' {
  export function Header(): JSX.Element;
}

declare module '@/components/footer' {
  export function Footer(): JSX.Element;
}
