
      (() => {
        const links = Array.from(document.querySelectorAll("[data-guide-section-link]"));
        if (!links.length) {
          return;
        }

        const linksById = new Map(links.map((link) => [link.dataset.sectionId, link]));
        const headings = links
          .map((link) => document.getElementById(link.dataset.sectionId || ""))
          .filter(Boolean);
        let activeLink;
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

        const setActiveSection = (sectionId) => {
          const nextLink = linksById.get(sectionId) || links[0];
          if (activeLink && activeLink !== nextLink) {
            activeLink.classList.remove("active");
            activeLink.removeAttribute("aria-current");
          }
          if (nextLink) {
            nextLink.classList.add("active");
            nextLink.setAttribute("aria-current", "location");
            activeLink = nextLink;
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
        window.addEventListener("hashchange", () => {
          window.setTimeout(() => {
            if (!setActiveSectionFromHash()) {
              queueActiveSectionUpdate();
            }
          }, 0);
        });
        if (!setActiveSectionFromHash()) {
          updateActiveSection();
        }
      })();
    