/** Label du rideau de transition, aligné sur la destination cliquée. */
export function curtainLabelForHref(href: string): string {
  const [path, hash] = href.split("#");

  if (hash === "notes") return "Notes";

  switch (path) {
    case "/":
      return "Marques";
    case "/revendeurs":
      return "Revendeurs";
    case "/a-suivre":
      return "À suivre";
    case "/a-propos":
      return "Le projet";
    default:
      return "Selekt";
  }
}
