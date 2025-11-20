// scripts/main.js
async function loadComponents() {
    // try {
    //     // For GitHub: use absolute path with repo name
    //     // For Local: use relative path based on current location
    //     let headerPath;
    //     if (SITE_CONFIG.isGitHub) {
    //         headerPath = `${SITE_CONFIG.basePath}components/header.html`;
    //     } else {
    //         // Calculate relative path for local development
    //         const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    //         const depth = pathSegments.length - 1;
    //         headerPath = '../'.repeat(Math.max(0, depth)) + 'components/header.html';
    //     }
        
    //     const headerResp = await fetch(headerPath);
    //     if (headerResp.ok) {
    //         let headerHTML = await headerResp.text();
            
    //         // Process only INTERNAL paths in header (not external URLs)
    //         headerHTML = headerHTML.replace(/(href|src)="((?!http|https|#|mailto:)[^"]*)"/g, (match, attr, path) => {
    //             if (SITE_CONFIG.isGitHub) {
    //                 // GitHub: convert to absolute path with repo name
    //                 return `${attr}="${SITE_CONFIG.basePath}${path}"`;
    //             } else {
    //                 // Local: convert to absolute paths
    //                 return `${attr}="/${path}"`;
    //             }
    //         });
            
    //         document.getElementById('header-container').innerHTML = headerHTML;
    //     }

    //     // menu buttom behaviour 
    //     setupMenuButton()
    // } catch (err) {
    //     console.error('Failed to load header:', err);
    // }

    try {
        let headerHTML = '';
        try {
            const resp = await fetch('/components/header.html');
            headerHTML = await resp.text();
        } catch (err) {
            console.error('Header not found');
        }
        document.getElementById('header-container').innerHTML = headerHTML;

        setupMenuButton()

        // Loading Footer ...
        let footerHTML = '';
        try {
            const resp = await fetch('/components/footer.html');
            footerHTML = await resp.text();
        } catch (err) {
            console.error('Footer not found');
        }
        document.getElementById('footer-container').innerHTML = footerHTML;

        setTimeout(updateCopyrightYear, 10);
        // subMenuToggle();

    } catch (error) {
        console.error("[ERROR] Loading components failed:", error);
    }


    // try {
    //     // For GitHub: use absolute path with repo name
    //     // For Local: use relative path based on current location
    //     let footerPath;
    //     if (SITE_CONFIG.isGitHub) {
    //         footerPath = `${SITE_CONFIG.basePath}components/footer.html`;
    //     } else {
    //         // Calculate relative path for local development
    //         const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    //         const depth = pathSegments.length - 1;
    //         footerPath = '../'.repeat(Math.max(0, depth)) + 'components/footer.html';
    //     }
        
    //     const footerResp = await fetch(footerPath);
    //     if (footerResp.ok) {
    //         let footerHTML = await footerResp.text();
            
    //         // Process only INTERNAL paths in footer (not external URLs)
    //         footerHTML = footerHTML.replace(/(href|src)="((?!http|https|#|mailto:)[^"]*)"/g, (match, attr, path) => {
    //             if (SITE_CONFIG.isGitHub) {
    //                 // GitHub: convert to absolute path with repo name
    //                 return `${attr}="${SITE_CONFIG.basePath}${path}"`;
    //             } else {
    //                 // Local: convert to absolute paths
    //                 return `${attr}="/${path}"`;
    //             }
    //         });
            
    //         document.getElementById('footer-container').innerHTML = footerHTML;
            
    //     }
    //     setTimeout(updateCopyrightYear, 10);
    // } catch (err) {
    //     console.error('Failed to load footer:', err);
    // }
}

// menu buttom behaviour 
function setupMenuButton() {
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        });
    } else {
        console.log('Menu button not found yet');
    }
}


function updateCopyrightYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

document.addEventListener('DOMContentLoaded', loadComponents);
