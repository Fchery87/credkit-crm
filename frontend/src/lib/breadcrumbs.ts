export type Crumb = { label: string; href?: string };

export function buildBreadcrumbsFromPath(pathname: string, base: Crumb[] = []): Crumb[] {
  const parts = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
  const crumbs: Crumb[] = [...base];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    crumbs.push({
      label: decodeURIComponent(parts[i]).replace(/-/g, " "),
      href: isLast ? undefined : acc,
    });
  }
  return crumbs;
}

export function titleCase(label: string): string {
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}