/**
 * The trail back to the hub, rendered at the top of a zone's ROOT page.
 *
 * Three constraints, all of them load-bearing:
 *
 * 1. **Absolute `https://blode.co` hrefs.** A bare `href="/"` is not
 *    `basePath`-prefixed, so in a zone it resolves against the child's own
 *    origin and breaks on preview deployments.
 * 2. **Plain `<a>`, never `next/link`.** `next/link` would prefetch an RSC
 *    payload for a route this app does not own. These are also same-origin
 *    (a zone is blode.co behind a rewrite), so: same tab, and no
 *    `rel="noopener noreferrer"`, which only means something cross-origin.
 * 3. **The visible trail must match `BreadcrumbList` exactly.** Google treats a
 *    mismatch as a markup error. Both start at "Matthew Blode", not "Home":
 *    the root crumb is the one piece of chrome every zone shows above the fold,
 *    so it may as well say who made the thing.
 *
 * Root page only. Inner pages have their own navigation and a second trail
 * would just be noise.
 */

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const HOME = "https://blode.co";
const PROJECTS = `${HOME}/projects`;

export const ZoneBreadcrumb = ({ product }: { product: string }) => (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        {/*
          `rel="author"` marks this as the identity edge, matching the footer
          credit. Only this crumb carries it; /projects is a collection.
        */}
        <BreadcrumbLink href={HOME} rel="author">
          Matthew Blode
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href={PROJECTS}>Projects</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{product}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);
