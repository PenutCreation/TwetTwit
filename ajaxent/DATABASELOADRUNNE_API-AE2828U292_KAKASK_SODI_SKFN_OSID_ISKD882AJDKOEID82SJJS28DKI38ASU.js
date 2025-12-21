// main.js
// Global variables
let currentUser = null;
let postsPerPage = 20;
let currentPage = 0;
let currentMediaType = null;
let allPosts = [];
let displayedPosts = new Set();
let DATABASEPOSTS = []; // Initialize as empty array
let sharedPostId = null;

// Store all registered users in localStorage
const USERS_KEY = 'meko-registered-users';
const CURRENT_USER_KEY = 'meko-current-user';

// DOM Elements
const elements = {
    // Auth elements
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    authTabs: document.querySelectorAll('.auth-tab'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupUsername: document.getElementById('signupUsername'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupConfirmPassword: document.getElementById('signupConfirmPassword'),
    usernameError: document.getElementById('usernameError'),
    createNewAccount: document.getElementById('createNewAccount'),
    loginError: document.getElementById('loginError'),
    
    // Main app elements
    appContainer: document.querySelector('.app-container'),
    postsFeed: document.getElementById('postsFeed'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    searchToggle: document.getElementById('searchToggle'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    profileModal: document.getElementById('profileModal'),
    postModal: document.getElementById('postModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    closePostModal: document.getElementById('closePostModal'),
    searchHistory: document.getElementById('searchHistory'),
    suggestedProfiles: document.getElementById('suggestedProfiles'),
    trendingList: document.getElementById('trendingList'),
    postContent: document.getElementById('postContent'),
    mediaPreview: document.getElementById('mediaPreview'),
    imageUpload: document.getElementById('imageUpload'),
    videoUpload: document.getElementById('videoUpload'),
    linkInput: document.getElementById('linkInput'),
    postTopic: document.getElementById('postTopic'),
    postContentModal: document.getElementById('postContentModal'),
    postTopicModal: document.getElementById('postTopicModal'),
    mediaPreviewModal: document.getElementById('mediaPreviewModal'),
    submitNewPostBtn: document.getElementById('submitNewPostBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    addVideoBtn: document.getElementById('addVideoBtn'),
    addLinkBtn: document.getElementById('addLinkBtn'),
    
    // Mobile elements
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    closeMobileMenu: document.getElementById('closeMobileMenu'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserUsername: document.getElementById('mobileUserUsername'),
    mobileProfileLink: document.getElementById('mobileProfileLink'),
    mobileLogoutLink: document.getElementById('mobileLogoutLink'),
    
    bottomSearchBtn: document.getElementById('bottomSearchBtn'),
    
    bottomProfileBtn: document.getElementById('bottomProfileBtn'),
    
    // User menu elements
    userMenu: document.getElementById('userMenu'),
    menuToggle: document.getElementById('menuToggle'),
    profileLink: document.getElementById('profileLink'),
    logoutLink: document.getElementById('logoutLink'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    userAvatar: document.querySelector('#userAvatar img')
};

// ==================== VIDEO SECURITY FUNCTIONS ====================

/**
 * Generate secure token for video URL hiding
 */
function generateSecureVideoToken(videoUrl, postId) {
    try {
        const payload = JSON.stringify({
            src: videoUrl,
            pid: postId,
            exp: Date.now() + (1000 * 60 * 10) // 10 min expiry
        });
        return btoa(payload.split('').reverse().join(''));
    } catch (error) {
        console.error('Error generating video token:', error);
        return null;
    }
}

/**
 * Decode secure video token
 */
 
function decodeSecureVideoToken(token) {
    try {
        const decoded = atob(token).split('').reverse().join('');
        const data = JSON.parse(decoded);
        if (Date.now() > data.exp) {
            console.warn('Video token expired');
            return null;
        }
        return data.src;
    } catch (error) {
        console.error('Error decoding video token:', error);
        return null;
    }
}

/**
 * Load secure video when visible - PROTECTED VERSION
 */
 function loadSecureVideo(videoElement, secureToken) {
    if (videoElement.dataset.loaded) return;
    
    try {
        // Set loading poster

        // Decode to get real URL
        const url = decodeSecureVideoToken(secureToken);
        
        if (url) {
            // Set the src - THIS IS NECESSARY!
            videoElement.src = url;
            videoElement.load();
            videoElement.dataset.loaded = "1";
        } else {
            videoElement.poster = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxMTEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3IgbG9hZGluZyB2aWRlbzwvdGV4dD48L3N2Zz4=';
        }
    } catch (error) {
        console.error('Error loading secure video:', error);
    }
}
/**
 * Video observer for lazy loading
 */
function setupVideoObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // For secure videos
                if (video.classList.contains('secure-video') && video.dataset.src) {
                    loadSecureVideo(video, video.dataset.src);
                }
                
                // Auto-play when visible
                if (video.paused && video.src) {
                    video.play().catch(e => {
                        // Auto-play blocked, this is normal
                        console.log('Video auto-play blocked:', e.name);
                    });
                }
            } else {
                // Pause when not visible
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, { 
        threshold: 0.75,
        rootMargin: '50px'
    });
    
    return observer;
}

/**
 * Render media content with SECURE video handling - FIXED VERSION
 */
function renderMediaContent(post, postId) {
    if (post.iframe) {
        return `<div class="post-media"><iframe class="post-iframe" src="${post.iframe}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } 
    else if (post.video) {
        // ALWAYS use secure token - no fallback!
        const secureToken = generateSecureVideoToken(post.video, postId);
        
        // If token generation fails, show placeholder
        if (!secureToken) {
            console.error('Failed to generate secure token for video');
            return `<div class="post-media video-error">
                <div style="padding: 2rem; text-align: center; background: var(--bg-secondary); border-radius: 0.5rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">Video loading error</p>
                </div>
            </div>`;
        }
        
        // CRITICAL: SECURE VERSION ONLY - NO src ATTRIBUTE AT ALL!
        // We'll also add a MutationObserver to prevent other scripts from adding src
        const videoId = `secure-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<div class="post-media" id="media-container-${videoId}">
            <video class="auto-pause-video secure-video" 
                   data-src="${secureToken}" 
                   data-video-id="${videoId}"
                   loop 
                   controls 
                   controlsList="nodownload noplaybackrate" 
                   oncontextmenu="return false;" 
                   disablePictureInPicture 
                   style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; pointer-events: auto;"
                   preload="metadata">
                Your browser does not support the video tag.
            </video>
            <div class="video-protection-overlay"></div>
        </div>
        <script>
            // Immediately protect this video from other scripts
            (function() {
                const video = document.querySelector('[data-video-id="${videoId}"]');
                if (video) {
                    // Remove ANY src attribute that might have been added
                    video.removeAttribute('src');
                    
                    // Watch for attempts to add src
                    const observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                                if (!video.dataset.loaded) {
                                    console.log('Blocked attempt to set src on secure video:', video.dataset.videoId);
                                    video.removeAttribute('src');
                                }
                            }
                        });
                    });
                    
                    observer.observe(video, { attributes: true });
                    
                    // Clean up after video loads
                    video.addEventListener('loadeddata', function() {
                        setTimeout(() => observer.disconnect(), 500);
                    });
                }
            })();
        </script>`;
    } 
    else if (post.image) {
        return `<div class="post-media"><img src="${post.image}" alt="Post image" loading="lazy" oncontextmenu="return false;" crossorigin="anonymous"></div>`;
    }
    return '';
}

// ==================== OBSERVER INITIALIZATION ====================

// Initialize video observer globally
let videoObserver = null;

function initializeVideoObserver() {
    if (!videoObserver) {
        videoObserver = setupVideoObserver();
        
        // Observe existing secure videos
        document.querySelectorAll('.secure-video[data-src]').forEach(video => {
            if (!video.dataset.loaded) {
                videoObserver.observe(video);
            }
        });
    }
    return videoObserver;
}

// Call this after posts are rendered
function setupVideoObservation() {
    const observer = initializeVideoObserver();
    
    // Observe all secure videos on the page
    document.querySelectorAll('.secure-video[data-src]').forEach(video => {
        if (!video.dataset.loaded) {
            observer.observe(video);
        }
    });
    
    console.log('Video observer setup complete');
}

// ==================== ADD THIS FUNCTION TO CLEAN UP VIDEOS ====================

function cleanupVideoAttributes() {
    // Find and remove src attributes from all secure videos that shouldn't have them
    document.querySelectorAll('.secure-video[data-src]').forEach(video => {
        if (video.hasAttribute('src') && !video.dataset.loaded) {
            console.log('Removing unauthorized src attribute from video:', video.dataset.src);
            video.removeAttribute('src');
        }
    });
}

// ==================== AUTH FUNCTIONS ====================

function showAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.add('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.add('hidden');
    }
}

function hideAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.remove('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.remove('hidden');
    }
}

function getRegisteredUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
}

function saveUser(username, userData) {
    const users = getRegisteredUsers();
    users[username] = userData;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isUsernameTaken(username) {
    const users = getRegisteredUsers();
    
    if (users[username]) {
        return true;
    }
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        return DATABASEPOSTS.some(post => post.username === username);
    }
    
    return false;
}

function saveCurrentUser() {
    if (currentUser && !currentUser.isGuest) {
        const userToSave = {
            ...currentUser,
            likedPosts: currentUser.likedPosts ? Array.from(currentUser.likedPosts) : [],
            followedTopics: currentUser.followedTopics ? Array.from(currentUser.followedTopics) : []
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
        
        const users = getRegisteredUsers();
        if (users[currentUser.username]) {
            users[currentUser.username] = {
                ...users[currentUser.username],
                likedPosts: userToSave.likedPosts,
                searchHistory: userToSave.searchHistory,
                followedTopics: userToSave.followedTopics
            };
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            
            currentUser = {
                ...parsedUser,
                likedPosts: new Set(parsedUser.likedPosts || []),
                followedTopics: new Set(parsedUser.followedTopics || []),
                isGuest: false
            };
            
            console.log('User automatically logged in:', currentUser.username);
            
            // Only initialize posts if we have data
            if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
                initializePosts();
                loadPosts();
                loadTrendingTopics();
                loadSuggestedProfiles();
            }
            
            hideAuthModal();
            updateUserUI();
            loadSearchHistory();
            
            return true;
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }
    
    showAuthModal();
    
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    updateUserUI();
    return false;
}

function updateUserUI() {
    if (!currentUser) return;
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1e3a8a&color=fff&bold=true`;
    
    if (elements.currentUserAvatar) {
        elements.currentUserAvatar.src = avatarUrl;
    }
    
    if (elements.userAvatar) {
        elements.userAvatar.src = avatarUrl;
    }
    
    if (elements.mobileUserName) {
        elements.mobileUserName.textContent = currentUser.name;
    }
    
    if (elements.mobileUserUsername) {
        elements.mobileUserUsername.textContent = `@${currentUser.username}`;
    }
    
    const mobileAvatar = elements.mobileMenu?.querySelector('.user-avatar img');
    if (mobileAvatar) mobileAvatar.src = avatarUrl;
}

function switchAuthTab(e) {
    const tab = e.target;
    const tabName = tab.dataset.tab;
    
    elements.authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
     document.getElementById(`${tabName}Form`).classList.add('active');
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.loginUsername.value.trim().toLowerCase();
    const password = elements.loginPassword.value.trim();
    
    if (elements.loginError) {
        elements.loginError.style.display = 'none';
        elements.loginError.textContent = '';
    }
    
    if (!username || !password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Please fill in all fields';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    const users = getRegisteredUsers();
    
    if (!users[username]) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Account not found. Please sign up first.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    if (users[username].password !== password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Wrong password. Please try again.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    const userData = users[username];
    const likedPosts = new Set(userData.likedPosts || []);
    const followedTopics = new Set(userData.followedTopics || []);
    
    currentUser = {
        name: userData.name,
        username: username,
        email: userData.email,
        likedPosts: likedPosts,
        searchHistory: userData.searchHistory || [],
        followedTopics: followedTopics,
        isGuest: false
    };
    
    saveCurrentUser();
    
    saveUser(username, {
        ...userData,
        likedPosts: Array.from(likedPosts),
        searchHistory: currentUser.searchHistory,
        followedTopics: Array.from(followedTopics)
    });
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        initializePosts();
        loadPosts();
        loadTrendingTopics();
        loadSuggestedProfiles();
    }
    
    hideAuthModal();
    updateUserUI();
    loadSearchHistory();
    
    if (elements.loginForm) elements.loginForm.reset();
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = elements.signupName.value.trim();
    const username = elements.signupUsername.value.trim().toLowerCase();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value.trim();
    const confirmPassword = elements.signupConfirmPassword.value.trim();
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    
    if (!name || !username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (isUsernameTaken(username)) {
        if (elements.usernameError) {
            elements.usernameError.textContent = 'This username is already taken.';
            elements.usernameError.style.display = 'block';
        }
        return;
    }
    
    const userData = {
        name: name,
        email: email,
        password: password,
        likedPosts: [],
        searchHistory: [],
        followedTopics: [],
        createdAt: new Date().toISOString()
    };
    
    saveUser(username, userData);
    
    currentUser = {
        name: name,
        username: username,
        email: email,
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: false
    };
    
    saveCurrentUser();
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        initializePosts();
        loadPosts();
        loadTrendingTopics();
        loadSuggestedProfiles();
    }
    
    hideAuthModal();
    updateUserUI();
    
    if (elements.signupForm) elements.signupForm.reset();
    
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
}

function handleLogout(e) {
    if (e) e.preventDefault();
    
    localStorage.removeItem(CURRENT_USER_KEY);
    
    showAuthModal();
    
    if (elements.loginForm) elements.loginForm.reset();
    if (elements.signupForm) elements.signupForm.reset();
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
    
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    currentPage = 0;
    allPosts = [];
    
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    updateUserUI();
}

// ==================== POST FUNCTIONS ====================

// Add this function to process URL parameters on page load
function processUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    
    if (shareParam) {
        sharedPostId = shareParam.trim();
        console.log('Found shared post ID in URL:', sharedPostId);
        
        // Wait a moment for posts to load, then try to show the shared post
        setTimeout(() => {
            showSharedPostModal(sharedPostId);
        }, 500);
    }
}

// Create a modal to display shared posts
function createShareModal() {
    // Check if modal already exists
    if (document.getElementById('sharePostModal')) return;
    
    const modalHTML = `
        <div class="modal" id="sharePostModal">
            <div class="modal-content share-post-modal">
                <div class="modal-header">
                    <h2>Shared Post</h2>
                    <button class="close-modal" id="closeShareModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="sharedPostContainer">
                        <!-- The shared post will be displayed here -->
                        <div class="loading-shared-post" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent);"></i>
                            <p style="margin-top: 1rem; color: var(--text-secondary);">Loading shared post...</p>
                        </div>
                    </div>
                    <div class="share-actions" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-primary" id="backToFeedsBtn" style="width: 100%;">
                            <i class="fas fa-home"></i> Back to Feeds
                        </button>
                        <button class="btn btn-secondary" id="copyShareLinkBtn" style="width: 100%; margin-top: 0.75rem;">
                            <i class="fas fa-link"></i> Copy Share Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners for the new modal
    setupShareModalEvents();
}

function setupShareModalEvents() {
    const closeShareModal = document.getElementById('closeShareModal');
    const backToFeedsBtn = document.getElementById('backToFeedsBtn');
    const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
    
    if (closeShareModal) {
        closeShareModal.addEventListener('click', closeSharePostModal);
    }
    
    if (backToFeedsBtn) {
        backToFeedsBtn.addEventListener('click', closeSharePostModal);
    }
    
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', copyCurrentShareLink);
    }
    
    // Close when clicking outside modal
    const shareModal = document.getElementById('sharePostModal');
    if (shareModal) {
        shareModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeSharePostModal();
            }
        });
    }
}

function showSharedPostModal(postId) {
    // Create the modal if it doesn't exist
    createShareModal();
    
    const modal = document.getElementById('sharePostModal');
    if (!modal) return;
    
    // Show the modal
    modal.classList.add('active');
    
    // Find the post
    const post = allPosts.find(p => p.id === postId);
    const sharedPostContainer = document.getElementById('sharedPostContainer');
    
    if (!post || !sharedPostContainer) {
        sharedPostContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-primary);">Post Not Found</h3>
                <p style="color: var(--text-secondary);">The shared post could not be found.</p>
                <button onclick="closeSharePostModal()" class="btn btn-primary" style="margin-top: 1rem;">
                    Back to Feeds
                </button>
            </div>
        `;
        return;
    }
    
    // Create and display the post
    const postElement = createPostElement(post, post.id);
    
    // Remove any existing share button from this post (we'll add our own)
    const shareBtn = postElement.querySelector('.share-btn');
    if (shareBtn) shareBtn.remove();
    
    // Wrap the post in a container for the modal
    sharedPostContainer.innerHTML = '';
    sharedPostContainer.appendChild(postElement);
    
    // Update the copy button with current URL
    const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
    if (copyShareLinkBtn) {
        const shareUrl = generateShareUrl(post.id);
        copyShareLinkBtn.dataset.shareUrl = shareUrl;
    }
    
    // Scroll the post into view
    setTimeout(() => {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function closeSharePostModal() {
    const modal = document.getElementById('sharePostModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Clean URL without refreshing page
    if (window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    }
    
    sharedPostId = null;
}

function generateShareUrl(postId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${postId}`;
}

function copyCurrentShareLink() {
    const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
    if (!copyShareLinkBtn || !copyShareLinkBtn.dataset.shareUrl) return;
    
    const shareUrl = copyShareLinkBtn.dataset.shareUrl;
    
    navigator.clipboard.writeText(shareUrl)
        .then(() => {
            // Show success feedback
            const originalText = copyShareLinkBtn.innerHTML;
            copyShareLinkBtn.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
            copyShareLinkBtn.classList.add('success');
            
            setTimeout(() => {
                copyShareLinkBtn.innerHTML = originalText;
                copyShareLinkBtn.classList.remove('success');
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy link. Please copy it manually.');
        });
}

// Add share button to each post
function addShareButtonToPost(postElement, postId) {
    // Check if share button already exists
    if (postElement.querySelector('.share-btn')) return;
    
    // Find the post-actions-buttons container
    const postActions = postElement.querySelector('.post-actions-buttons');
    if (!postActions) return;
    
    // Create share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn share-btn';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
    shareBtn.dataset.postId = postId;
    
    // Add click event
    shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sharePost(postId);
    });
    
    // Insert before the like button
    const likeBtn = postActions.querySelector('[data-action="like"]');
    if (likeBtn) {
        postActions.insertBefore(shareBtn, likeBtn);
    } else {
        postActions.appendChild(shareBtn);
    }
}

function sharePost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) {
        alert('Post not found');
        return;
    }
    
    const shareUrl = generateShareUrl(postId);
    
    // Create share options
    const shareOptions = `
        <div class="share-options">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Share Post</h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Share Link:
                </label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" readonly value="${shareUrl}" id="shareUrlInput" 
                           style="flex: 1; padding: 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; color: var(--text-primary); font-size: 0.9rem;">
                    <button id="copyShareUrlBtn" class="btn btn-primary" style="white-space: nowrap;">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
            
            <div class="share-platforms" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem;">
                <button class="share-platform-btn" data-platform="whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="share-platform-btn" data-platform="facebook">
                    <i class="fab fa-facebook"></i> Facebook
                </button>
                <button class="share-platform-btn" data-platform="twitter">
                    <i class="fab fa-twitter"></i> Twitter
                </button>
                <button class="share-platform-btn" data-platform="telegram">
                    <i class="fab fa-telegram"></i> Telegram
                </button>
                <button class="share-platform-btn" data-platform="reddit">
                    <i class="fab fa-reddit"></i> Reddit
                </button>
                <button class="share-platform-btn" data-platform="email">
                    <i class="fas fa-envelope"></i> Email
                </button>
            </div>
        </div>
    `;
    
    // Create and show modal
    showCustomModal('Share Post', shareOptions, () => {
        // Setup copy button
        const copyBtn = document.getElementById('copyShareUrlBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const input = document.getElementById('shareUrlInput');
                if (input) {
                    input.select();
                    document.execCommand('copy');
                    
                    // Show feedback
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('success');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove('success');
                    }, 2000);
                }
            });
        }
        
        // Setup platform buttons
        document.querySelectorAll('.share-platform-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.dataset.platform;
                shareToPlatform(platform, shareUrl, post);
            });
        });
    });
}

function showCustomModal(title, content, onOpen = null) {
    // Remove existing custom modal if any
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const modalHTML = `
        <div class="modal" id="customModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-modal" id="closeCustomModal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('customModal');
    const closeBtn = document.getElementById('closeCustomModal');
    
    if (modal) {
        modal.classList.add('active');
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }
    
    // Close when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                setTimeout(() => this.remove(), 300);
            }
        });
    }
    
    // Call onOpen callback
    if (onOpen) onOpen();
}

function shareToPlatform(platform, url, post) {
    const postContent = post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : '';
    const text = `Check out this post on Meko Network by @${post.username}: ${postContent}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    
    let shareUrl = '';
    
    // Get media URL for thumbnail/preview
    const mediaUrl = getMediaUrlForSharing(post);
    const encodedMediaUrl = mediaUrl ? encodeURIComponent(mediaUrl) : '';
    
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            break;
            
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
            
        case 'x':
            const hashtags = post.topic ? `&hashtags=${encodeURIComponent(post.topic)}` : '';
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}${hashtags}`;
            break;
            
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
            break;
            
        case 'reddit':
            shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
            break;
            
        case 'pinterest':
            if (mediaUrl && (post.image || post.video)) {
                const description = encodeURIComponent(`${text} - Shared from Meko Network`);
                shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedMediaUrl}&description=${description}`;
            } else {
                shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
            }
            break;
            
        case 'tumblr':
            if (post.image) {
                shareUrl = `https://www.tumblr.com/widgets/share/tool?posttype=photo&content=${encodedMediaUrl}&caption=${encodedText}&canonicalUrl=${encodedUrl}`;
            } else if (post.video) {
                shareUrl = `https://www.tumblr.com/widgets/share/tool?posttype=video&content=${encodedMediaUrl}&caption=${encodedText}&canonicalUrl=${encodedUrl}`;
            } else {
                shareUrl = `https://www.tumblr.com/widgets/share/tool?posttype=link&content=${encodedUrl}&caption=${encodedText}`;
            }
            break;
            
        case 'email':
            const subject = encodeURIComponent(`Check out this post on Meko Network`);
            let emailBody = `${text}%0A%0A${encodedUrl}%0A%0A`;
            
            if (mediaUrl) {
                if (post.image) {
                    emailBody += `📷 View image: ${mediaUrl}%0A%0A`;
                } else if (post.video) {
                    emailBody += `🎬 Watch video: ${mediaUrl}%0A%0A`;
                }
            }
            
            emailBody += `Shared from Meko Network`;
            shareUrl = `mailto:?subject=${subject}&body=${emailBody}`;
            break;
            
        case 'copy':
            let copyText = `${text}\n\n`;
            
            if (mediaUrl) {
                if (post.image) {
                    copyText += `Image: ${mediaUrl}\n`;
                } else if (post.video) {
                    copyText += `Video: ${mediaUrl}\n`;
                }
            }
            
            copyText += `\nView post: ${url}\n\nShared from Meko Network`;
            
            navigator.clipboard.writeText(copyText)
                .then(() => {
                    const copyBtn = document.querySelector('.share-platform-btn[data-platform="copy"]');
                    if (copyBtn) {
                        const originalText = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        copyBtn.classList.add('success');
                        
                        setTimeout(() => {
                            copyBtn.innerHTML = originalText;
                            copyBtn.classList.remove('success');
                        }, 2000);
                    }
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    const textArea = document.createElement('textarea');
                    textArea.value = copyText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    alert('Link copied to clipboard!');
                });
            return;
            
        default:
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
}

function getMediaUrlForSharing(post) {
    if (post.image) {
        return post.image;
    } else if (post.video) {
        return post.video;
    } else if (post.iframe) {
        return getYouTubeThumbnail(post.iframe);
    }
    return null;
}

function getYouTubeThumbnail(url) {
    if (!url) return null;
    
    try {
        let videoId = '';
        
        if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('shorts/')[1].split('?')[0];
        }
        
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
    } catch (error) {
        console.error('Error extracting YouTube thumbnail:', error);
    }
    
    return null;
}

function updateShareModalHTML(shareUrl, post) {
    const mediaUrl = getMediaUrlForSharing(post);
    const hasMedia = !!mediaUrl;
    
    return `
        <div class="share-options">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Share Post</h3>
            
            ${hasMedia ? `
            <div class="share-preview" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; border: 1px solid var(--border-color);">
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    ${post.image ? `
                        <img src="${post.image}" alt="Post image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
                    ` : post.video ? `
                        <div style="width: 80px; height: 80px; background: var(--bg-tertiary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-video" style="font-size: 1.5rem; color: var(--text-secondary);"></i>
                        </div>
                    ` : post.iframe ? `
                        <div style="width: 80px; height: 80px; background: var(--bg-tertiary); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fab fa-youtube" style="font-size: 1.5rem; color: #FF0000;"></i>
                        </div>
                    ` : ''}
                    
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">
                            ${post.content ? post.content.substring(0, 80) + (post.content.length > 80 ? '...' : '') : 'Shared post'}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            by @${post.username}
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Share Link:
                </label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" readonly value="${shareUrl}" id="shareUrlInput" 
                           style="flex: 1; padding: 0.75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; color: var(--text-primary); font-size: 0.9rem;">
                    <button id="copyShareUrlBtn" class="btn btn-primary" style="white-space: nowrap;">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
            
            <div class="share-platforms" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 1rem;">
                <button class="share-platform-btn" data-platform="copy" title="Copy to clipboard">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="share-platform-btn" data-platform="whatsapp" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="share-platform-btn" data-platform="facebook" title="Share on Facebook">
                    <i class="fab fa-facebook"></i> Facebook
                </button>
                <button class="share-platform-btn" data-platform="x" title="Share on X (Twitter)">
                    <i class="fab fa-x-twitter"></i> X
                </button>
                <button class="share-platform-btn" data-platform="telegram" title="Share on Telegram">
                    <i class="fab fa-telegram"></i> Telegram
                </button>
                <button class="share-platform-btn" data-platform="reddit" title="Share on Reddit">
                    <i class="fab fa-reddit"></i> Reddit
                </button>
                ${hasMedia ? `
                <button class="share-platform-btn" data-platform="pinterest" title="Share on Pinterest">
                    <i class="fab fa-pinterest"></i> Pinterest
                </button>
                ` : ''}
                <button class="share-platform-btn" data-platform="tumblr" title="Share on Tumblr">
                    <i class="fab fa-tumblr"></i> Tumblr
                </button>
                <button class="share-platform-btn" data-platform="email" title="Share via Email">
                    <i class="fas fa-envelope"></i> Email
                </button>
            </div>
            
            <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                ${hasMedia ? 'Media preview will appear on supported platforms' : 'Text-only share on most platforms'}
            </div>
        </div>
    `;
}

function sharePost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) {
        alert('Post not found');
        return;
    }
    
    const shareUrl = generateShareUrl(postId);
    const modalContent = updateShareModalHTML(shareUrl, post);
    
    showCustomModal('Share Post', modalContent, () => {
        const copyBtn = document.getElementById('copyShareUrlBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const input = document.getElementById('shareUrlInput');
                if (input) {
                    input.select();
                    navigator.clipboard.writeText(input.value)
                        .then(() => {
                            const originalText = copyBtn.innerHTML;
                            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            copyBtn.classList.add('success');
                            
                            setTimeout(() => {
                                copyBtn.innerHTML = originalText;
                                copyBtn.classList.remove('success');
                            }, 2000);
                        })
                        .catch(err => {
                            document.execCommand('copy');
                            alert('Link copied to clipboard!');
                        });
                }
            });
        }
        
        document.querySelectorAll('.share-platform-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.dataset.platform;
                shareToPlatform(platform, shareUrl, post);
                
                if (platform !== 'copy') {
                    const modal = document.getElementById('customModal');
                    if (modal) {
                        setTimeout(() => {
                            modal.classList.remove('active');
                            setTimeout(() => modal.remove(), 300);
                        }, 500);
                    }
                }
            });
        });
    });
}

function initializePosts() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for initialization');
        return;
    }
    
    console.log(`Initializing ${DATABASEPOSTS.length} posts`);
    
    allPosts = [...DATABASEPOSTS];
    
    allPosts.forEach((post, index) => {
        const recoNumber = DATABASEPOSTS.length - index;
        post.id = `meko-${post.username.toLowerCase()}-reco${recoNumber}`;
        post.recoNumber = recoNumber;
    });
    
    allPosts = allPosts.reverse();
    
    console.log(`Assigned IDs to ${allPosts.length} posts`);
    console.log('Newest post sample:', {
        id: allPosts[0]?.id,
        username: allPosts[0]?.username,
        recoNumber: allPosts[0]?.recoNumber
    });
    console.log('Oldest post sample:', {
        id: allPosts[allPosts.length - 1]?.id,
        username: allPosts[allPosts.length - 1]?.username,
        recoNumber: allPosts[allPosts.length - 1]?.recoNumber
    });
    
    const seed = Date.now() + Math.random();
    allPosts = shuffleArray(allPosts, seed);
    
    console.log(`Loaded ${allPosts.length} posts with seed: ${seed}`);
    console.log('Sample shuffled post with ID:', allPosts[0]?.id, allPosts[0]?.username);
}

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function shuffleArray(array, seed) {
    const shuffled = [...array];
    const randomFunc = seededRandom(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(randomFunc * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

function loadPosts() {
    if (!elements.postsFeed) return;
    
    if (allPosts.length === 0) {
        console.log('No posts available to load');
        return;
    }
    
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    const postsToShow = allPosts
        .filter(post => !displayedPosts.has(post.id))
        .slice(startIndex, endIndex);
    
    console.log(`Loading ${postsToShow.length} posts, page ${currentPage + 1}`);
    
    if (postsToShow.length === 0) {
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.textContent = 'No more posts';
            elements.loadMoreBtn.disabled = true;
        }
        return;
    }
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
        
        addShareButtonToPost(postElement, post.id);
    });
    
    currentPage++;
    
    if (elements.loadMoreBtn) {
        const remainingPosts = allPosts.length - displayedPosts.size;
        elements.loadMoreBtn.disabled = remainingPosts === 0;
        elements.loadMoreBtn.textContent = remainingPosts === 0 ? 'No more posts' : `Reach me to Load More`;
    }
}

function loadMorePosts() {
    loadPosts();
}

function createPostElement(post, postId) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.postId = postId;
    postElement.dataset.topic = post.topic || '';
    
    const isApiAd = post.iframe && post.iframe === "ad_service-api:290Ae028e028a028_920397Ae828";
    const isAdTopic = post.topic && (post.topic.toLowerCase().includes('ad') || 
                                     post.topic.toLowerCase().includes('ad_service-api:290Ae028e028a028_920397Ae828'));
    const isSponsoredName = post.name && post.name.toLowerCase().includes('ad_service-api:290Ae028e028a028_920397Ae828');
    const isCreatorAd = post.topic && (post.topic.toLowerCase() === 'ad_service-api:290Ae028e028a028_920397Ae828' || 
                                       post.topic.toLowerCase() === 'ad_service-api:290Ae028e028a028_920397Ae828');
    
    let adType = null;
    if (isApiAd) {
        adType = 'API_AD';
    } else if (isSponsoredName) {
        adType = 'SPONSORED_AD';
    } else if (isCreatorAd) {
        adType = 'CREATOR_AD';
    } else if (isAdTopic) {
        adType = 'TOPIC_AD';
    }
    
    const isAnyAd = adType !== null;
    
    const postDate = parseCustomDate(post.datePost);
    const formattedDate = formatDateToCustom(postDate);
    
    const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
    
    const firstPost = userPosts[userPosts.length - 1];
    const joinedDate = firstPost
        ? formatJoinedDate(parseCustomDate(firstPost.datePost))
        : 'Recently';
    
    let mentionedUsers = [];
    let processedContent = post.content || '';
    
    if (post.content) {
        const mentionRegex = /@(\w+)/g;
        let match;
        
        while ((match = mentionRegex.exec(post.content)) !== null) {
            mentionedUsers.push(match[1]);
        }
        
        processedContent = post.content.replace(
            /@(\w+)/g,
            '<span class="mention" data-username="$1">@$1</span>'
        );
    }
    
    const mentionsCurrentUser =
        currentUser &&
        !currentUser.isGuest &&
        mentionedUsers.includes(currentUser.username);
    
    let adLabel = '';
    let adClass = '';
    let userDisplayName = post.name;
    let userDisplayUsername = '@' + post.username;
    
    switch(adType) {
        case 'API_AD':
            adLabel = 'Sponsored • Ad';
            adClass = 'ad-api';
            userDisplayName = 'Sponsored';
            userDisplayUsername = 'Advertisement';
            break;
        case 'SPONSORED_AD':
            adLabel = 'Sponsored';
            adClass = 'ad-sponsored';
            userDisplayName = 'Sponsored';
            userDisplayUsername = '@' + post.username;
            break;
        case 'CREATOR_AD':
            adLabel = 'Creator Ad';
            adClass = 'ad-creator';
            break;
        case 'TOPIC_AD':
            adLabel = 'Promoted';
            adClass = 'ad-topic';
            break;
    }
    
    const renderMediaForThisPost = (post) => {
        if (adType === 'API_AD') {
            return `<div id="ad-${postId}" class="ad-script-container"></div>`;
        }
        return renderMediaContent(post, postId);
    };
    
    postElement.innerHTML = `  
        <div class="post-header ${adClass}">  
            <div class="post-user" ${!isAnyAd ? `data-username="${post.username}"` : ''}>  
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=${isAnyAd ? '4a5568' : '1e3a8a'}&color=fff">  
                <div class="user-info">  
                    <h3>${userDisplayName} ${isAnyAd ? '<span class="ad-badge">Ad</span>' : ''}</h3>  
                    <span>${userDisplayUsername}</span>  
                </div>  
            </div>  
            <div class="post-date">${formattedDate}</div>  
        </div>  
        
        <div class="post-content">  
            ${isAnyAd ? `<div class="ad-container">` : ''}
            
            ${processedContent ? `<p class="${isAnyAd ? 'ad-content-text' : ''}">${processedContent}</p>` : ''}
            
            ${renderMediaForThisPost(post)}
            
            ${isAnyAd ? `</div>` : ''}
        </div>  
        
        ${isAnyAd ? `
            <div class="post-stats ad-stats">
                <span class="ad-label">${adLabel}</span>
                ${post.likes > 0 ? `<span class="ad-likes">${post.likes.toLocaleString()} reactions</span>` : ''}
            </div>
        ` : `  
            <div class="post-stats">  
                <span>${post.likes.toLocaleString()} likes</span>  
                ${mentionedUsers.length > 0  
                    ? `<span class="mentions-info">  
                        Mentions ${mentionedUsers.length} user${  
                          mentionedUsers.length > 1 ? 's' : ''  
                      }  
                       </span>`  
                    : ''  
                }  
                ${mentionsCurrentUser  
                    ? `<span class="mention-you">Mentions you!</span>`  
                    : ''  
                }  
            </div>  
            
<div class="post-actions-buttons">  

        <button class="action-btn ${currentUser?.likedPosts?.has(postId) ? 'liked' : ''}" data-action="like" data-post-id="${postId}">  
            <i class="fas fa-heart"></i> Like  
        </button>  
        <button class="action-btn share-btn" data-action="share" data-post-id="${postId}">  
            <i class="fas fa-share-alt"></i> Share  
        </button>  
    </div>  
        `}  
    `;
    
    if (adType === 'API_AD') {
        const adContainer = postElement.querySelector(`#ad-${postId}`);
        if (adContainer) {
            adContainer.innerHTML = `
<script type="text/javascript">
  atOptions = {
  	'key' : 'd00f4eb20818128f182b8839788682d3',
  	'format' : 'iframe',
  	'height' : 250,
  	'width' : 300,
  	'params' : {}
  };
</script>
<script
  type="text/javascript"
  src="https://www.highperformanceformat.com/d00f4eb20818128f182b8839788682d3/invoke.js"
></script>
`;
        }
        return postElement;
    }
    
    const videoElement = postElement.querySelector('.secure-video');
    if (videoElement && videoObserver) {
        videoObserver.observe(videoElement);
    }
    
    if (!isAnyAd) {
        const likeBtn = postElement.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => handleLike(postId, likeBtn));
        }
    } else if (adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const likeBtn = postElement.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                if (!currentUser || currentUser.isGuest) {
                    alert('Please login to react to ads!');
                    return;
                }
                handleLike(postId, likeBtn);
            });
        } else {
            const adLikes = postElement.querySelector('.ad-likes');
            if (adLikes) {
                adLikes.style.cursor = 'pointer';
                adLikes.addEventListener('click', () => {
                    if (!currentUser || currentUser.isGuest) {
                        alert('Please login to react to ads!');
                        return;
                    }
                    alert('Thanks for your reaction to this ad!');
                });
            }
        }
    }
    
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const userInfo = postElement.querySelector('.post-user');
        if (userInfo) {
            userInfo.addEventListener('click', () =>
                showUserProfile(post.username, post.name)
            );
        }
    }
    
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        postElement.querySelectorAll('.mention').forEach(mention => {
            mention.addEventListener('click', e => {
                e.stopPropagation();
                const username = mention.dataset.username;
                const userExists = DATABASEPOSTS.some(p => p.username === username);
                userExists
                    ? showUserProfile(username, username)
                    : alert(`User @${username} not found`);
            });
        });
    }
    
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const shareBtn = postElement.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                sharePost(postId);
            });
        } else {
            setTimeout(() => addShareButtonToPost(postElement, postId), 100);
        }
    }

    return postElement;
}

// ==================== VIDEO HELPER FUNCTIONS ====================

function convertToEmbedUrl(url) {
    if (!url) return null;
    
    try {
        let cleanUrl = url.split('&')[0];
        
        if (cleanUrl.includes('/shorts/')) {
            const videoId = cleanUrl.split('/shorts/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        
        let videoId = '';
        
        if (cleanUrl.includes('m.youtube.com/watch') || cleanUrl.includes('youtube.com/watch')) {
            try {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } catch {
                const match = url.match(/[?&]v=([^&]+)/);
                videoId = match ? match[1] : '';
            }
        }
        else if (cleanUrl.includes('youtu.be/')) {
            videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
        }
        else if (cleanUrl.includes('youtube.com') && cleanUrl.includes('v=')) {
            const match = cleanUrl.match(/v=([^&]+)/);
            videoId = match ? match[1] : '';
        }
        
        if (videoId) {
            videoId = videoId.split('&')[0].split('#')[0].split('?')[0];
            
            if (videoId.length >= 11) {
                videoId = videoId.substring(0, 11);
            }
            
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
        
        if (cleanUrl.includes('youtube.com/embed/')) {
            return cleanUrl;
        }
        
        return null;
    } catch (error) {
        console.error('Error converting YouTube URL:', error, 'URL:', url);
        return null;
    }
}

function isYouTubeUrl(url) {
    if (!url) return false;
    
    const youtubePatterns = [
        'youtube.com',
        'youtu.be',
        'youtube.com/shorts',
        'm.youtube.com'
    ];
    
    return youtubePatterns.some(pattern => url.includes(pattern));
}

function getMentionsForUser(username) {
    const userMentions = [];
    
    for (let i = 0; i < DATABASEPOSTS.length; i++) {
        const post = DATABASEPOSTS[i];
        const postId = DATABASEPOSTS.length - i;
        
        if (post.content && post.content.includes(`@${username}`)) {
            userMentions.push({
                postId: postId,
                post: post,
                datePost: parseCustomDate(post.datePost),
                mentionedBy: post.username,
                topic: post.topic || '',
                positionInArray: i
            });
        }
    }
    
    userMentions.sort((a, b) => b.datePost - a.datePost);
    return userMentions;
}

// ==================== DATE FUNCTIONS ====================

function parseCustomDate(dateString) {
    try {
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        if (!dateString || typeof dateString !== 'string') {
            console.warn('Invalid date input:', dateString);
            return new Date();
        }
        
        const parts = dateString.split(' ');
        
        if (parts.length < 4) {
            console.warn('Invalid date format, expecting 4 parts:', dateString);
            return new Date();
        }
        
        const monthAbbr = parts[0];
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const timePart = parts[3];
        
        const month = months[monthAbbr];
        if (month === undefined) {
            console.warn('Invalid month:', monthAbbr);
            return new Date();
        }
        
        const timeMatch = timePart.match(/(\d+):(\d+)(AM|PM)/i);
        if (!timeMatch) {
            console.warn('Invalid time format, trying alternative:', timePart);
            const altParts = dateString.split(' ');
            if (altParts.length >= 5) {
                const altTimePart = altParts[3] + altParts[4];
                const altTimeMatch = altTimePart.match(/(\d+):(\d+)(AM|PM)/i);
                if (altTimeMatch) {
                    let hours = parseInt(altTimeMatch[1]);
                    const minutes = parseInt(altTimeMatch[2]);
                    const ampm = altTimeMatch[3].toUpperCase();
                    
                    if (ampm === 'PM' && hours < 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                    
                    return new Date(year, month, day, hours, minutes);
                }
            }
            return new Date(year, month, day);
        }
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return new Date(year, month, day, hours, minutes);
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return new Date();
    }
}

function formatDateToCustom(date) {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'Invalid Date';
    }
}

function formatJoinedDate(date) {
    try {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${month} ${year}`;
    } catch (error) {
        console.error('Error formatting joined date:', date, error);
        return 'Recently';
    }
}

// ==================== SOUND FUNCTIONS ====================

let likeSound = null;
let unlikeSound = null;
let soundsLoaded = false;

function initSounds() {
    try {
        likeSound = new Audio();
        unlikeSound = new Audio();
        
        likeSound.src = 'sounds/like.mp3';
        unlikeSound.src = 'sounds/unlike.mp3';
        
        likeSound.preload = 'auto';
        unlikeSound.preload = 'auto';
        likeSound.load();
        unlikeSound.load();
        
        soundsLoaded = true;
        console.log('Sounds loaded successfully');
    } catch (error) {
        console.error('Error loading sounds:', error);
        soundsLoaded = false;
    }
}

function playLikeSound() {
    if (!soundsLoaded || !likeSound) {
        playFallbackSound('like');
        return;
    }
    
    try {
        likeSound.currentTime = 0;
        likeSound.volume = 0.5;
        likeSound.play().catch(e => {
            console.log('Could not play like sound:', e);
            playFallbackSound('like');
        });
    } catch (error) {
        console.log('Error playing like sound:', error);
        playFallbackSound('like');
    }
}

function playUnlikeSound() {
    if (!soundsLoaded || !unlikeSound) {
        playFallbackSound('unlike');
        return;
    }
    
    try {
        unlikeSound.currentTime = 0;
        unlikeSound.volume = 0.3;
        unlikeSound.play().catch(e => {
            console.log('Could not play unlike sound:', e);
            playFallbackSound('unlike');
        });
    } catch (error) {
        console.log('Error playing unlike sound:', error);
        playFallbackSound('unlike');
    }
}

function playFallbackSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        
        oscillator.connect(audioContext.destination);
        oscillator.frequency.value = type === 'like' ? 600 : 400;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Fallback sound failed');
    }
}

let soundEnabled = true;

function handleLike(postId, button) {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to like posts!');
        return;
    }
    
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (!currentUser.likedPosts) currentUser.likedPosts = new Set();
    
    const postElement = button.closest('.post-card');
    const likesSpan = postElement.querySelector('.post-stats span:first-child');
    
    let currentLikes = post.likes;
    if (likesSpan) {
        const likesText = likesSpan.textContent;
        currentLikes = parseInt(likesText.replace(/[^0-9]/g, ''));
    }
    
    if (currentUser.likedPosts.has(postId)) {
        currentUser.likedPosts.delete(postId);
        currentLikes--;
        button.classList.remove('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Like';
        if (soundEnabled) playUnlikeSound();
    } else {
        currentUser.likedPosts.add(postId);
        currentLikes++;
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Liked';
        if (soundEnabled) playLikeSound();
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    post.likes = currentLikes;
    
    if (likesSpan) {
        likesSpan.textContent = `${currentLikes.toLocaleString()} likes`;
        likesSpan.style.color = 'var(--accent)';
        setTimeout(() => {
            likesSpan.style.color = '';
        }, 300);
    }
    
    saveCurrentUser();
}

function scrollToPost(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.style.boxShadow = '0 0 0 3px var(--accent)';
        postElement.style.transition = 'box-shadow 0.3s';
        setTimeout(() => {
            postElement.style.boxShadow = '';
        }, 2000);
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ==================== SEARCH FUNCTIONS ====================

function toggleSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) {
            if (elements.searchInput) elements.searchInput.focus();
        }
    }
}

function handleSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        if (elements.searchResults) {
            elements.searchResults.style.display = 'none';
        }
        return;
    }
    
    const searchResults = {
        profiles: searchProfiles(query),
        topics: searchTopics(query),
        posts: searchPosts(query)
    };
    
    displayEnhancedSearchResults(searchResults, query);
}

function searchProfiles(query) {
    const uniqueUsers = new Map();
    
    DATABASEPOSTS.forEach(post => {
        if (!uniqueUsers.has(post.username)) {
            const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
            const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
            
            uniqueUsers.set(post.username, {
                name: post.name,
                username: post.username,
                postsCount: userPosts.length,
                totalLikes: totalLikes,
                type: 'profile'
            });
        }
    });
    
    return Array.from(uniqueUsers.values()).filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.username.toLowerCase().includes(query)
    );
}

function searchTopics(query) {
    const topics = {};
    
    DATABASEPOSTS.forEach(post => {
        if (post.topic && post.topic.toLowerCase().includes(query)) {
            topics[post.topic] = (topics[post.topic] || 0) + 1;
        }
    });
    
    return Object.entries(topics)
        .map(([topic, count]) => ({
            name: `#${topic}`,
            topic: topic,
            postsCount: count,
            type: 'topic'
        }))
        .sort((a, b) => b.postsCount - a.postsCount);
}

function searchPosts(query) {
    return allPosts
        .filter(post => 
            (post.content && post.content.toLowerCase().includes(query)) ||
            (post.topic && post.topic.toLowerCase().includes(query))
        )
        .map(post => ({
            name: post.name,
            username: post.username,
            content: post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : '',
            datePost: post.datePost,
            likes: post.likes,
            type: 'post',
            postId: post.id
        }))
        .slice(0, 5);
}

function displayEnhancedSearchResults(results, query) {
    if (!elements.searchResults) return;
    
    const { profiles, topics, posts } = results;
    
    elements.searchResults.innerHTML = '';
    
    let hasResults = false;
    
    if (profiles.length > 0) {
        hasResults = true;
        const profileSection = createSearchSection('Profiles', 'user');
        profiles.slice(0, 5).forEach(profile => {
            profileSection.appendChild(createProfileResultItem(profile));
        });
        elements.searchResults.appendChild(profileSection);
    }
    
    if (topics.length > 0) {
        hasResults = true;
        const topicSection = createSearchSection('Topics', 'hashtag');
        topics.slice(0, 5).forEach(topic => {
            topicSection.appendChild(createTopicResultItem(topic));
        });
        elements.searchResults.appendChild(topicSection);
    }
    
    if (posts.length > 0) {
        hasResults = true;
        const postSection = createSearchSection('Posts', 'file-alt');
        posts.forEach(post => {
            postSection.appendChild(createPostResultItem(post));
        });
        elements.searchResults.appendChild(postSection);
    }
    
    if (!hasResults) {
        const noResults = document.createElement('div');
        noResults.className = 'search-result-item';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <div>No results found for "${query}"</div>
            </div>
        `;
        elements.searchResults.appendChild(noResults);
    }
    
    elements.searchResults.style.display = 'block';
}

function createSearchSection(title, icon) {
    const section = document.createElement('div');
    section.className = 'search-section';
    section.innerHTML = `
        <div class="search-section-header">
            <i class="fas fa-${icon}"></i>
            <span>${title}</span>
        </div>
    `;
    return section;
}

function createProfileResultItem(profile) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1e3a8a&color=fff" alt="${profile.name}">
        <div class="search-result-info">
            <h4>${profile.name}</h4>
            <span>@${profile.username}</span>
            <div class="search-result-meta">
                <span>${profile.postsCount} posts • ${profile.totalLikes.toLocaleString()} likes</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        showUserProfile(profile.username, profile.name);
        addToSearchHistory(profile.username, profile.name, 'profile');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}

function createTopicResultItem(topic) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
        <div class="topic-icon">
            <i class="fas fa-hashtag"></i>
        </div>
        <div class="search-result-info">
            <h4>${topic.name}</h4>
            <div class="search-result-meta">
                <span>${topic.postsCount} posts</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        filterPostsByTopic(topic.topic);
        addToSearchHistory(topic.topic, topic.name, 'topic');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}

function createPostResultItem(post) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    const postDate = parseCustomDate(post.datePost);
    const formattedDate = formatDateToCustom(postDate);
    
    item.innerHTML = `
        <div class="post-icon">
            <i class="fas fa-file-alt"></i>
        </div>
        <div class="search-result-info">
            <h4>${post.name}</h4>
            <span>@${post.username} • ${formattedDate}</span>
            <div class="search-result-content">${post.content}</div>
            <div class="search-result-meta">
                <span><i class="fas fa-heart"></i> ${post.likes}</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => {
        scrollToPost(post.postId);
        addToSearchHistory(post.username, `Post by ${post.name}`, 'post');
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchResults) elements.searchResults.style.display = 'none';
        document.querySelector('.search-bar')?.classList.remove('active');
    });
    
    return item;
}

function showSearchResults() {
    if (elements.searchInput && elements.searchInput.value.trim().length > 0) {
        if (elements.searchResults) elements.searchResults.style.display = 'block';
    }
}

function addToSearchHistory(identifier, name, type) {
    if (!currentUser) return;
    
    if (!currentUser.searchHistory) currentUser.searchHistory = [];
    
    const searchItem = { 
        identifier, 
        name, 
        type, 
        timestamp: new Date() 
    };
    
    currentUser.searchHistory = currentUser.searchHistory.filter(item => 
        !(item.identifier === identifier && item.type === type)
    );
    
    currentUser.searchHistory.unshift(searchItem);
    currentUser.searchHistory = currentUser.searchHistory.slice(0, 5);
    
    saveCurrentUser();
    loadSearchHistory();
}

function loadSearchHistory() {
    if (!currentUser || !currentUser.searchHistory || !elements.searchHistory) return;
    
    elements.searchHistory.innerHTML = '';
    
    currentUser.searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        let icon = 'history';
        if (item.type === 'profile') icon = 'user';
        if (item.type === 'topic') icon = 'hashtag';
        if (item.type === 'post') icon = 'file-alt';
        
        historyItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${icon}" style="color: var(--text-muted);"></i>
                <div style="flex: 1; min-width: 0;">
                    <div style="color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: capitalize;">${item.type}</div>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            if (item.type === 'profile') {
                showUserProfile(item.identifier, item.name);
            } else if (item.type === 'topic') {
                filterPostsByTopic(item.identifier);
            } else if (item.type === 'post') {
                scrollToPost(item.identifier);
            }
        });
        
        elements.searchHistory.appendChild(historyItem);
    });
}

function filterPostsByTopic(topic) {
    if (!elements.postsFeed) return;
    
    elements.postsFeed.innerHTML = '';
    currentPage = 0;
    displayedPosts.clear();
    
    const filteredPosts = allPosts.filter(post => post.topic === topic);
    const shuffledPosts = shuffleArray([...filteredPosts], new Date().getTime());
    
    shuffledPosts.slice(0, postsPerPage).forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
    });
    
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'none';
    }
}

function loadTrendingTopics() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for trending topics');
        return;
    }
    
    const topics = {};
    
    DATABASEPOSTS.forEach(post => {
        if (post.topic) {
            topics[post.topic] = (topics[post.topic] || 0) + 1;
        }
    });
    
    const sortedTopics = Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (elements.trendingList) {
        elements.trendingList.innerHTML = '';
        
        sortedTopics.forEach(([topic, count]) => {
            const topicItem = document.createElement('div');
            topicItem.className = 'trending-item';
            topicItem.innerHTML = `
                <div style="font-weight: 500; color: var(--text-primary);">#${topic}</div>
                <span>${count} posts</span>
            `;
            
            topicItem.addEventListener('click', () => {
                filterPostsByTopic(topic);
            });
            
            elements.trendingList.appendChild(topicItem);
        });
    }
}

function loadSuggestedProfiles() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for suggested profiles');
        return;
    }
    
    const uniqueUsers = new Map();
    
    DATABASEPOSTS.forEach(post => {
        if (!uniqueUsers.has(post.username)) {
            const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
            const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
            
            uniqueUsers.set(post.username, {
                name: post.name,
                username: post.username,
                postsCount: userPosts.length,
                totalLikes: totalLikes
            });
        }
    });
    
    const suggestedProfiles = Array.from(uniqueUsers.values())
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);
    
    if (elements.suggestedProfiles) {
        elements.suggestedProfiles.innerHTML = '';
        
        suggestedProfiles.forEach(user => {
            const profileItem = document.createElement('div');
            profileItem.className = 'profile-item';
            profileItem.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e3a8a&color=fff" alt="${user.name}">
                <div class="profile-info">
                    <h4>${user.name}</h4>
                    <span>${user.postsCount} posts • ${user.totalLikes.toLocaleString()} likes</span>
                </div>
            `;
            
            profileItem.addEventListener('click', () => {
                showUserProfile(user.username, user.name);
            });
            
            elements.suggestedProfiles.appendChild(profileItem);
        });
    }
}

// ==================== PROFILE FUNCTIONS ====================

function showOwnProfile() {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to view your profile!');
        return;
    }
    
    const userPosts = DATABASEPOSTS.filter(post => 
        post.username === currentUser.username || 
        post.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    
    console.log(`Found ${userPosts.length} posts for user ${currentUser.username}`);
    
    if (userPosts.length === 0) {
        showUserProfile(currentUser.username, currentUser.name, true);
        return;
    }
    
    showUserProfile(currentUser.username, currentUser.name, true);
}

function showUserProfile(username, name, isOwnProfile = false) {
    console.log(`Showing profile for ${username} (isOwnProfile: ${isOwnProfile})`);
    
    const userPosts = DATABASEPOSTS.filter(post => 
        post.username === username || 
        post.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`Found ${userPosts.length} posts for ${username}`);
    
    if (userPosts.length === 0 && !isOwnProfile) {
        alert('User not found or has no posts');
        return;
    }
    
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const postsCount = userPosts.length;
    const userMentions = getMentionsForUser(username);
    const averageLikes = postsCount > 0 ? Math.round(totalLikes / postsCount) : 0;
    
    let joinedDate = 'Recently';
    if (userPosts.length > 0) {
        const sortedPosts = [...userPosts].sort((a, b) => {
            const dateA = parseCustomDate(a.datePost);
            const dateB = parseCustomDate(b.datePost);
            return dateA - dateB;
        });
        
        const firstPost = sortedPosts[0];
        if (firstPost && firstPost.datePost) {
            joinedDate = formatJoinedDate(parseCustomDate(firstPost.datePost));
        }
    }
    
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&size=128" alt="${name}">
                    ${isOwnProfile ? '<div class="profile-badge">You</div>' : ''}
                </div>
                <h2 id="profileName">${name}</h2>
                <div class="profile-username">@${username}</div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${postsCount}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalLikes.toLocaleString()}</span>
                        <span class="stat-label">Total Likes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${userMentions.length}</span>
                        <span class="stat-label">Mentions</span>
                    </div>
                    ${averageLikes > 0 ? `
                    <div class="stat-item">
                        <span class="stat-value">${averageLikes.toLocaleString()}</span>
                        <span class="stat-label">Avg. Likes</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="profile-meta">
                    <div class="joined-date">
                        <i class="fas fa-calendar-alt"></i>
                        Joined ${joinedDate}
                    </div>
                    ${isOwnProfile ? `
                    <div class="profile-actions">
                        <button class="btn-secondary" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) profileNameElement.textContent = name;
    
    const profilePosts = document.getElementById('profilePosts');
    if (profilePosts) {
        profilePosts.innerHTML = '';
        
        const tabsHTML = `
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="posts">
                    <i class="fas fa-newspaper"></i>
                    Posts (${postsCount})
                </button>
                <button class="profile-tab" data-tab="mentions">
                    <i class="fas fa-at"></i>
                    Mentions (${userMentions.length})
                </button>
                ${isOwnProfile ? `
                <button class="profile-tab" data-tab="liked">
                    <i class="fas fa-heart"></i>
                    Liked Posts (${currentUser?.likedPosts?.size || 0})
                </button>
                ` : ''}
            </div>
            <div class="profile-content">
                <div class="tab-content active" id="postsTab"></div>
                <div class="tab-content" id="mentionsTab"></div>
                ${isOwnProfile ? `<div class="tab-content" id="likedTab"></div>` : ''}
            </div>
        `;
        
        profilePosts.innerHTML = tabsHTML;
        
        const postsTab = document.getElementById('postsTab');
        if (userPosts.length > 0) {
            const userPostsSorted = [...userPosts].sort((a, b) => {
                const dateA = parseCustomDate(a.datePost);
                const dateB = parseCustomDate(b.datePost);
                return dateB - dateA;
            });
            
            userPostsSorted.forEach((post) => {
                const foundPost = allPosts.find(p => 
                    p.username === post.username && 
                    p.datePost === post.datePost &&
                    p.content === post.content
                );
                
                if (foundPost) {
                    const postElement = createPostElement(foundPost, foundPost.id);
                    postsTab.appendChild(postElement);
                } else {
                    const tempId = Date.now() + Math.random();
                    const postElement = createPostElement(post, tempId);
                    postsTab.appendChild(postElement);
                }
            });
        } else {
            postsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No posts yet</h3>
                    <p>${isOwnProfile ? 'You haven\'t posted anything yet.' : 'This user hasn\'t posted anything yet.'}</p>
                    ${isOwnProfile ? `
                    <button class="btn btn-primary" onclick="showPostModal()">
                        <i class="fas fa-plus"></i> Create Your First Post
                    </button>
                    ` : ''}
                </div>
            `;
        }
        
        const mentionsTab = document.getElementById('mentionsTab');
        if (userMentions.length > 0) {
            userMentions.forEach(mention => {
                const foundPost = allPosts.find(p => p.id === mention.postId);
                if (foundPost) {
                    const postElement = createPostElement(foundPost, mention.postId);
                    mentionsTab.appendChild(postElement);
                }
            });
        } else {
            mentionsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-at"></i>
                    <h3>No mentions yet</h3>
                    <p>${isOwnProfile ? 'You haven\'t been mentioned yet.' : 'This user hasn\'t been mentioned yet.'}</p>
                </div>
            `;
        }
        
        if (isOwnProfile) {
            const likedTab = document.getElementById('likedTab');
            const likedPosts = Array.from(currentUser?.likedPosts || []);
            
            if (likedPosts.length > 0) {
                const likedPostObjects = likedPosts
                    .map(postId => allPosts.find(p => p.id === postId))
                    .filter(post => post);
                
                likedPostObjects.forEach(post => {
                    const postElement = createPostElement(post, post.id);
                    likedTab.appendChild(postElement);
                });
            } else {
                likedTab.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart"></i>
                        <h3>No liked posts yet</h3>
                        <p>Posts you like will appear here.</p>
                    </div>
                `;
            }
        }
        
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }
    
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
    }
}

// ==================== POST CREATION FUNCTIONS ====================

function showPostModal() {
    if (elements.postModal) {
        elements.postModal.classList.add('active');
    }
}

function handleMediaButtonClick(type) {
    currentMediaType = type;
    if (!elements.mediaPreview) return;
    
    elements.mediaPreview.innerHTML = '';
    elements.mediaPreview.classList.add('active');
    
    if (type === 'image') {
        if (elements.imageUpload) {
            elements.imageUpload.click();
            elements.imageUpload.onchange = handleImageUpload;
        }
    } else if (type === 'video') {
        if (elements.videoUpload) {
            elements.videoUpload.click();
            elements.videoUpload.onchange = handleVideoUpload;
        }
    } else if (type === 'iframe') {
        elements.mediaPreview.innerHTML = `
            <input type="text" id="linkInputInline" placeholder="Paste YouTube/Facebook link" 
                   style="width: 100%; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary);">
            <button id="processLinkBtn" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                Add Link
            </button>
        `;
        
        const processBtn = document.getElementById('processLinkBtn');
        if (processBtn) {
            processBtn.addEventListener('click', processLink);
        }
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && elements.mediaPreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.mediaPreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 0.5rem;">
                <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Image ready to post
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file && elements.mediaPreview) {
        elements.mediaPreview.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Video file selected: ${file.name}
            </div>
        `;
    }
}

function processLink() {
    const linkInput = document.getElementById('linkInputInline');
    if (!linkInput || !elements.mediaPreview) return;
    
    const link = linkInput.value.trim();
    
    if (!link) return;
    
    let embedLink = link;
    
    if (link.includes('youtube.com/shorts/')) {
        const videoId = link.match(/shorts\/([^?]+)/)[1];
        embedLink = `https://www.youtube.com/embed/${videoId}`;
    } else if (link.includes('youtu.be/')) {
        const videoId = link.match(/youtu\.be\/([^?]+)/)[1];
        embedLink = `https://www.youtube.com/embed/${videoId}`;
    } else if (link.includes('youtube.com/watch')) {
        const videoId = new URL(link).searchParams.get('v');
        if (videoId) {
            embedLink = `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    elements.mediaPreview.innerHTML = `
        <div style="color: var(--text-secondary); font-size: 0.9rem;">
            Link processed: ${embedLink.includes('youtube.com/embed') ? 'YouTube' : 'External'} link
        </div>
    `;
}

function createPost() {
    if (!elements.postContent) return;
    
    const content = elements.postContent.value.trim();
    const topic = elements.postTopic ? elements.postTopic.value.trim() : '';
    
    const hasMedia = elements.mediaPreview && 
                     elements.mediaPreview.classList.contains('active') && 
                     elements.mediaPreview.innerHTML.trim() !== '';
    
    if (!content && !hasMedia) {
        alert('Please add some content to your post!');
        return;
    }
    
    alert('Post functionality requires backend integration. In a real app, this would save to database.');
    
    if (elements.postContent) elements.postContent.value = '';
    if (elements.postTopic) elements.postTopic.value = '';
    if (elements.mediaPreview) {
        elements.mediaPreview.classList.remove('active');
        elements.mediaPreview.innerHTML = '';
    }
    currentMediaType = null;
}

function addMediaToPost(type) {
    if (!elements.mediaPreviewModal) return;
    
    elements.mediaPreviewModal.innerHTML = '';
    
    if (type === 'image') {
        elements.mediaPreviewModal.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Image upload would be implemented here
            </div>
        `;
    } else if (type === 'video') {
        elements.mediaPreviewModal.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Video upload would be implemented here
            </div>
        `;
    } else if (type === 'iframe') {
        elements.mediaPreviewModal.innerHTML = `
            <input type="text" id="linkInputModal" placeholder="Paste YouTube/Facebook link" 
                   style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; color: var(--text-primary);">
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                Supports: youtube.com, youtu.be, youtube.com/shorts
            </div>
        `;
    }
}

function createNewPost() {
    if (!elements.postContentModal) return;
    
    const content = elements.postContentModal.value.trim();
    const topic = elements.postTopicModal ? elements.postTopicModal.value.trim() : '';
    
    if (!content) {
        alert('Please add some content to your post!');
        return;
    }
    
    alert(`Post created successfully!\n\nNote: In a real app, this would be saved to the database.`);
    
    resetPostForm();
    if (elements.postModal) {
        elements.postModal.classList.remove('active');
    }
}

function resetPostForm() {
    if (elements.postContentModal) elements.postContentModal.value = '';
    if (elements.postTopicModal) elements.postTopicModal.value = '';
    if (elements.mediaPreviewModal) elements.mediaPreviewModal.innerHTML = '';
}

// ==================== MOBILE FUNCTIONS ====================

function openMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.add('active');
    }
}

function closeMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.remove('active');
    }
}

function toggleUserMenu() {
    if (elements.userMenu) {
        elements.userMenu.classList.toggle('active');
    }
}

// ==================== THEME FUNCTIONS ====================

function setupTheme() {
    const savedTheme = localStorage.getItem('meko-theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
        localStorage.setItem('meko-theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-moon';
        }
        localStorage.setItem('meko-theme', 'dark');
    }
}

// ==================== SETUP & INITIALIZATION ====================

function setupEventListeners() {
    // Initialize video observer
    videoObserver = setupVideoObserver();
    
    // Initialize sounds
    initSounds();
    
    // Auth event listeners
    if (elements.authTabs) {
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', switchAuthTab);
        });
    }
    
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignup);
    }
    
    if (elements.createNewAccount) {
        elements.createNewAccount.addEventListener('click', () => {
            document.querySelector('.auth-tab[data-tab="signup"]').click();
        });
    }
    
    // Theme toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Search functionality
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
        elements.searchInput.addEventListener('focus', showSearchResults);
    }
    
    if (elements.searchToggle) {
        elements.searchToggle.addEventListener('click', toggleSearchBar);
    }
    
    if (elements.bottomSearchBtn) {
        elements.bottomSearchBtn.addEventListener('click', toggleSearchBar);
    }
    
    // Modal controls
    if (elements.closeProfileModal) {
        elements.closeProfileModal.addEventListener('click', () => {
            elements.profileModal.classList.remove('active');
        });
    }
    
    if (elements.closePostModal) {
        elements.closePostModal.addEventListener('click', () => {
            elements.postModal.classList.remove('active');
            resetPostForm();
        });
    }
    
    // Load more posts
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.addEventListener('click', loadMorePosts);
    }
    
    // Media buttons
    document.querySelectorAll('.media-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            handleMediaButtonClick(type);
        });
    });
    
    // Profile links
    if (elements.profileLink) {
        elements.profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
        });
    }
    
    if (elements.mobileProfileLink) {
        elements.mobileProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
            closeMobileMenu();
        });
    }
    
    if (elements.bottomProfileBtn) {
        elements.bottomProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
        });
    }
    
    if (elements.userMenu && elements.menuToggle) {
        elements.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserMenu();
        });
        
        const menuProfileLink = elements.userMenu.querySelector('#profileLink');
        if (menuProfileLink) {
            menuProfileLink.addEventListener('click', (e) => {
                e.stopPropagation();
                showOwnProfile();
                if (elements.userMenu) {
                    elements.userMenu.classList.remove('active');
                }
            });
        }
    }
    
    // Media buttons in modal
    if (elements.addImageBtn) {
        elements.addImageBtn.addEventListener('click', () => addMediaToPost('image'));
    }
    
    if (elements.addVideoBtn) {
        elements.addVideoBtn.addEventListener('click', () => addMediaToPost('video'));
    }
    
    if (elements.addLinkBtn) {
        elements.addLinkBtn.addEventListener('click', () => addMediaToPost('iframe'));
    }
    
    // Mobile menu
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.addEventListener('click', openMobileMenu);
    }
    
    if (elements.closeMobileMenu) {
        elements.closeMobileMenu.addEventListener('click', closeMobileMenu);
    }
    
    // User menu
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleUserMenu);
    }
    
    if (elements.logoutLink) {
        elements.logoutLink.addEventListener('click', handleLogout);
    }
    
    if (elements.mobileLogoutLink) {
        elements.mobileLogoutLink.addEventListener('click', handleLogout);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (elements.profileModal && e.target === elements.profileModal) {
            elements.profileModal.classList.remove('active');
        }
        if (elements.postModal && e.target === elements.postModal) {
            elements.postModal.classList.remove('active');
            resetPostForm();
        }
        
        if (elements.userMenu && !elements.userMenu.contains(e.target) && e.target !== elements.menuToggle) {
            elements.userMenu.classList.remove('active');
        }
        
        if (elements.searchResults && !elements.searchResults.contains(e.target) && e.target !== elements.searchInput) {
            elements.searchResults.style.display = 'none';
        }
    });
    
    // Close search on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.searchResults) {
                elements.searchResults.style.display = 'none';
            }
            document.querySelector('.search-bar')?.classList.remove('active');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const shareModal = document.getElementById('sharePostModal');
            if (shareModal && shareModal.classList.contains('active')) {
                closeSharePostModal();
            }
        }
    });
}

function processPosts(postsArray) {
    console.log('Processing posts data...');

    if (!Array.isArray(postsArray)) {
        postsArray = [];
    }

    const validPosts = postsArray.filter(post => {
        if (!post || typeof post !== 'object') {
            console.log('Skipping invalid post object:', post);
            return false;
        }
        
        const hasRequired = post.name && post.username && post.datePost;
        if (!hasRequired) {
            return false;
        }
        
        try {
            const parsedDate = parseCustomDate(post.datePost);
            const isValidDate = !isNaN(parsedDate.getTime());
            if (!isValidDate) {
                console.log('Skipping post with invalid date:', post.datePost);
            }
            return isValidDate;
        } catch {
            return false;
        }
    });

    if (validPosts.length === 0) {
        renderEmptyState();
        return;
    }

    DATABASEPOSTS = [...validPosts];

    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    currentPage = 0;
    allPosts = [];

    DATABASEPOSTS.slice(0, 3).forEach((p, i) => {
    });

    initializePosts();
    loadTrendingTopics();
    loadSuggestedProfiles();
    loadPosts();

    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'block';
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.textContent = 'Load More';
    }

    console.log('Posts processing complete.');
}

const JSON_URL = "database_827_383_294_103_759_927_953.json";

function extractPostsFromJSON(data) {
    if (!data) {
        return [];
    }

    console.log("Data type:", typeof data);
    
    if (Array.isArray(data)) {
        return data;
    }
    
    return [];
}

function fetchPosts() {
    console.log("Fetching posts from:", JSON_URL);

    if (elements.postsFeed) {
        elements.postsFeed.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 3rem;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-secondary);">Loading posts...</p>
            </div>
        `;
    }

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });

    const fetchPromise = fetch(JSON_URL + "?v=" + Date.now(), {
        cache: "no-store",
        headers: {
            'Accept': 'application/json'
        }
    });

    Promise.race([fetchPromise, timeoutPromise])
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.text();
        })
        .then(text => {
            console.log("Raw response received, length:", text.length);
            
            let cleanedText = text.trim();
            
            if (!cleanedText.endsWith('}') && !cleanedText.endsWith(']')) {
                console.warn("JSON might be truncated, attempting to fix...");
                const lastBrace = cleanedText.lastIndexOf('}');
                const lastBracket = cleanedText.lastIndexOf(']');
                const cutIndex = Math.max(lastBrace, lastBracket);
                
                if (cutIndex > 0) {
                    cleanedText = cleanedText.substring(0, cutIndex + 1);
                    console.log("Trimmed to:", cleanedText.length, "chars");
                }
            }
            
            try {
                const data = JSON.parse(cleanedText);
                console.log("JSON parsed successfully");
                
                const postsArray = extractPostsFromJSON(data);
                console.log("Extracted posts:", postsArray.length);
                
                if (postsArray.length > 0) {
                    console.log("Sample post:", postsArray[0]);
                    processPosts(postsArray);
                } else {
                    console.error("No posts extracted");
                    renderEmptyState();
                }
            } catch (parseError) {
                console.error("JSON parse error:", parseError.message);
                const errorIndex = parseError.message.match(/position (\d+)/);
                if (errorIndex) {
                    const idx = parseInt(errorIndex[1]);
                    const start = Math.max(0, idx - 100);
                    const end = Math.min(cleanedText.length, idx + 100);
                    console.error("Context:", cleanedText.substring(start, end));
                }
                renderErrorState("Invalid JSON format received from server");
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            renderErrorState(err.message || "Failed to load posts");
            processPosts([]);
        });
}

function renderEmptyState() {
    if (!elements.postsFeed) return;

    elements.postsFeed.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-secondary);">No posts available</h3>
            <p style="font-size: 0.95rem; max-width: 300px; margin: 0 auto 1rem;">No posts could be loaded from the server.</p>
            <button onclick="fetchPosts()" class="btn btn-secondary" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;

    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = "none";
    }
}

function renderErrorState(message) {
    if (!elements.postsFeed) return;

    elements.postsFeed.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 3rem 1rem; color: var(--danger);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Failed to Load Posts</h3>
            <p style="margin: 1rem 0; color: var(--text-secondary);">${message}</p>
            <button onclick="fetchPosts()" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

function initializeApp() {
    console.log("Initializing app...");
    
    if (!elements || !elements.postsFeed) {
        console.error("DOM elements not ready yet!");
        setTimeout(initializeApp, 100);
        return;
    }
    
    setupEventListeners();
    setupTheme();
    
    processUrlParameters();
    
    fetchPosts();
    
    checkAuth();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

const style = document.createElement('style');
style.textContent = `
@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

function debugFetch() {
    console.log("=== DEBUG FETCH ===");
    console.log("URL:", JSON_URL);
    
    fetch(JSON_URL + "?debug=" + Date.now())
        .then(r => {
            console.log("Status:", r.status, r.statusText);
            return r.text();
        })
        .then(t => {
            console.log("Full response length:", t.length);
            console.log("First 1000 chars:", t.substring(0, 1000));
            console.log("Last 200 chars:", t.substring(t.length - 200));
            
            const openBraces = (t.match(/{/g) || []).length;
            const closeBraces = (t.match(/}/g) || []).length;
            const openBrackets = (t.match(/\[/g) || []).length;
            const closeBrackets = (t.match(/\]/g) || []).length;
            
            console.log("Counts: {=" + openBraces + " }=" + closeBraces + " [=" + openBrackets + " ]=" + closeBrackets);
            
            if (openBraces !== closeBraces) {
                console.error("MISMATCH: Braces don't match!");
            }
            if (openBrackets !== closeBrackets) {
                console.error("MISMATCH: Brackets don't match!");
            }
            
            try {
                const parsed = JSON.parse(t);
                console.log("✅ JSON is valid");
                console.log("Structure:", parsed);
            } catch(e) {
                console.error("❌ JSON parse error:", e.message);
            }
        })
        .catch(console.error);
}

// ==================== ADD THIS: CLEANUP ON PAGE LOAD ====================

// Run cleanup after a short delay to catch other scripts
setTimeout(() => {
    cleanupVideoAttributes();
    setupVideoObservation();
}, 500);

// Also run cleanup periodically
setInterval(cleanupVideoAttributes, 1000);
