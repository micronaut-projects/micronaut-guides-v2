
      (() => {
        const pageIndex = document.querySelector("[data-guide-page-index]");
        const pageIndexNav = pageIndex?.querySelector("[data-guide-page-index-nav]");
        const pageIndexTop = pageIndex?.querySelector("[data-guide-page-index-top]");
        if (!pageIndex || !pageIndexNav) {
          return;
        }

        const links = Array.from(pageIndexNav.querySelectorAll("[data-guide-page-index-link]"));
        const linksById = new Map(links.map((link) => [link.dataset.sectionId, link]));
        const guideSectionLinks = Array.from(document.querySelectorAll("[data-guide-section-link]"));
        const guideSectionLinksById = guideSectionLinks.reduce((byId, link) => {
          const sectionId = link.dataset.sectionId || "";
          const sectionLinks = byId.get(sectionId) || [];
          sectionLinks.push(link);
          byId.set(sectionId, sectionLinks);
          return byId;
        }, new Map());
        const headings = links
          .map((link) => document.getElementById(link.dataset.sectionId || ""))
          .filter(Boolean);
        let activeRootId = "";
        let activeLink;
        let activeGuideSectionId = "";
        let activeGuideSectionLinks = [];
        let updateFrame = 0;

        const scrollOffset = () => {
          const scrollPaddingTop = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
          const fixedOffset = (Number.isFinite(scrollPaddingTop) ? scrollPaddingTop : 80) + 16;
          return Math.max(fixedOffset, window.innerHeight * 0.25);
        };

        const activeHeadingFromScroll = () => {
          if (!headings.length) {
            return undefined;
          }
          const offset = scrollOffset();
          let activeHeading = headings[0];
          for (const heading of headings) {
            if (heading.getBoundingClientRect().top <= offset) {
              activeHeading = heading;
            } else {
              break;
            }
          }
          return activeHeading;
        };

        const scrollActiveLinkIntoView = (link) => {
          const container = link?.closest("[data-guide-page-index-inner]");
          if (!container || container.scrollHeight <= container.clientHeight) {
            return;
          }
          const containerRect = container.getBoundingClientRect();
          const linkRect = link.getBoundingClientRect();
          const margin = 20;
          if (linkRect.top < containerRect.top + margin) {
            container.scrollTop -= containerRect.top + margin - linkRect.top;
          } else if (linkRect.bottom > containerRect.bottom - margin) {
            container.scrollTop += linkRect.bottom - containerRect.bottom + margin;
          }
        };

        const setActiveSection = (sectionId) => {
          const nextLink = linksById.get(sectionId) || links[0];
          const nextRootId = nextLink?.dataset.rootId || "";
          if (nextRootId && nextRootId !== activeRootId) {
            activeRootId = nextRootId;
            const rootLink = linksById.get(activeRootId);
            if (pageIndexTop) {
              const rootLabel = rootLink?.textContent?.trim() || "section";
              pageIndexTop.href = `#${activeRootId}`;
              pageIndexTop.setAttribute("aria-label", `Back to ${rootLabel}`);
              pageIndexTop.setAttribute("title", `Back to ${rootLabel}`);
            }
            for (const link of links) {
              link.hidden = link.dataset.rootId !== activeRootId;
            }
          }

          if (activeLink && activeLink !== nextLink) {
            activeLink.classList.remove("active");
            activeLink.removeAttribute("aria-current");
          }
          if (nextLink) {
            nextLink.classList.add("active");
            nextLink.setAttribute("aria-current", "location");
            activeLink = nextLink;
            scrollActiveLinkIntoView(nextLink);
          }

          if (nextRootId && nextRootId !== activeGuideSectionId) {
            activeGuideSectionId = nextRootId;
            for (const link of activeGuideSectionLinks) {
              link.classList.remove("active");
              link.removeAttribute("aria-current");
            }
            activeGuideSectionLinks = guideSectionLinksById.get(nextRootId) || [];
            for (const link of activeGuideSectionLinks) {
              link.classList.add("active");
              link.setAttribute("aria-current", "location");
            }
          }
        };

        const setActiveSectionFromHash = () => {
          if (!window.location.hash) {
            return false;
          }
          let sectionId = "";
          try {
            sectionId = decodeURIComponent(window.location.hash.slice(1));
          } catch {
            sectionId = window.location.hash.slice(1);
          }
          if (!linksById.has(sectionId)) {
            return false;
          }
          setActiveSection(sectionId);
          return true;
        };

        const updateActiveSection = () => {
          updateFrame = 0;
          const activeHeading = activeHeadingFromScroll();
          if (activeHeading) {
            setActiveSection(activeHeading.id);
          }
        };

        const queueActiveSectionUpdate = () => {
          if (updateFrame) {
            return;
          }
          updateFrame = window.requestAnimationFrame(updateActiveSection);
        };

        window.addEventListener("scroll", queueActiveSectionUpdate, { passive: true });
        window.addEventListener("resize", queueActiveSectionUpdate);
        const queueHashSectionUpdate = () => {
          window.setTimeout(() => {
            if (!setActiveSectionFromHash()) {
              queueActiveSectionUpdate();
            }
          }, 0);
          window.setTimeout(() => {
            if (!setActiveSectionFromHash()) {
              queueActiveSectionUpdate();
            }
          }, 150);
        };

        window.addEventListener("hashchange", queueHashSectionUpdate);
        if (!setActiveSectionFromHash()) {
          updateActiveSection();
        }
        queueHashSectionUpdate();
      })();
    