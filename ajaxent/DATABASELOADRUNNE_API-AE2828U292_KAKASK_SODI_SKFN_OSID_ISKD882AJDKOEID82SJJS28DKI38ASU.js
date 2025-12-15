// main.js
// Global variables
let currentUser = null;
let postsPerPage = 5;
let currentPage = 0;
let currentMediaType = null;
let allPosts = [];
let displayedPosts = new Set();
let DATABASEPOSTS = []; // Initialize as empty array

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
    createPostBtn: document.getElementById('createPostBtn'),
    submitPostBtn: document.getElementById('submitPostBtn'),
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
    createPostMobile: document.getElementById('createPostMobile'),
    bottomSearchBtn: document.getElementById('bottomSearchBtn'),
    bottomCreatePostBtn: document.getElementById('bottomCreatePostBtn'),
    bottomProfileBtn: document.getElementById('bottomProfileBtn'),
    
    // User menu elements
    userMenu: document.getElementById('userMenu'),
    menuToggle: document.getElementById('menuToggle'),
    profileLink: document.getElementById('profileLink'),
    logoutLink: document.getElementById('logoutLink'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    userAvatar: document.querySelector('#userAvatar img')
};

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
function initializePosts() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for initialization');
        return;
    }
    
    console.log(`Initializing ${DATABASEPOSTS.length} posts`);
    
    // Create a copy of the posts
    allPosts = [...DATABASEPOSTS];
    
    // IMPORTANT: Assign consistent IDs based on position in original array
    // Since DATABASEPOSTS is the original order from JSON (oldest to newest)
    // We'll assign IDs where position 0 = oldest, position N = newest
    
    allPosts.forEach((post, index) => {
        // Calculate the ID number: (total posts - index) = highest number for newest posts
        // Example: 100 posts total, index 0 (oldest) = reco100, index 99 (newest) = reco1
        const recoNumber = DATABASEPOSTS.length - index;
        
        // Generate consistent ID: meko-username-recoX
        // Use the actual username from the post
        post.id = `meko-${post.username.toLowerCase()}-reco${recoNumber}`;
        
        // Also store the recoNumber for reference
        post.recoNumber = recoNumber;
    });
    
    // Now reverse to show newest first (with higher reco numbers)
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
    
    // Optional: Shuffle posts for variety (but keep IDs consistent!)
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
    
    // ===== ENHANCED AD DETECTION =====  
    const isApiAd = post.iframe && post.iframe === "ad_service-api:290Ae028e028a028_920397Ae828";
    const isAdTopic = post.topic && (post.topic.toLowerCase().includes('ad') || 
                                     post.topic.toLowerCase().includes('ads') || 
                                     post.topic.toLowerCase().includes('sponsored'));
    const isSponsoredName = post.name && post.name.toLowerCase().includes('sponsored');
    const isCreatorAd = post.topic && (post.topic.toLowerCase() === 'ads' || 
                                       post.topic.toLowerCase() === 'ads.brand');
    
    // Determine ad type
    let adType = null;
    if (isApiAd) {
        adType = 'API_AD'; // Official API ad
    } else if (isSponsoredName) {
        adType = 'SPONSORED_AD'; // Sponsored custom ad
    } else if (isCreatorAd) {
        adType = 'CREATOR_AD'; // Creator-made ad
    } else if (isAdTopic) {
        adType = 'TOPIC_AD'; // Topic-based ad
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
    
    // Determine ad label and styling
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
            userDisplayUsername = '@' + post.username; // Keep original username
            break;
        case 'CREATOR_AD':
            adLabel = 'Creator Ad';
            adClass = 'ad-creator';
            // Keep original name and username
            break;
        case 'TOPIC_AD':
            adLabel = 'Promoted';
            adClass = 'ad-topic';
            // Keep original name and username
            break;
    }
    
    // Override renderMediaContent for API ads
    const renderMediaForThisPost = (post) => {
        if (adType === 'API_AD') {
            // For API ads, return the script container instead of iframe
            return `<div id="ad-${postId}" class="ad-script-container"></div>`;
        }
        // For other posts, use the regular renderMediaContent
        return renderMediaContent(post);
    };
    
    // ===== HTML =====  
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
            </div>  
        `}  
    `;
    
    // ===== INJECT AD SCRIPT FOR API ADS =====  
    if (adType === 'API_AD') {
        const adContainer = postElement.querySelector(`#ad-${postId}`);
        if (adContainer) {
  // Inject both scripts as HTML
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
        
        // API ads don't have regular interactions
        return postElement;
    }
    
    // ===== VIDEO OBSERVER =====  
    const videoElement = postElement.querySelector('.auto-pause-video');
    if (videoElement && typeof postVideoObserver !== 'undefined') {
        postVideoObserver.observe(videoElement);
    }
    
    // ===== LIKE BUTTON =====  
    if (!isAnyAd) {
        const likeBtn = postElement.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => handleLike(postId, likeBtn));
        }
    } else if (adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        // Creator/topic ads can still be liked
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
            // If no like button, make the ad-likes clickable
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
    
    // ===== USER PROFILE =====  
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const userInfo = postElement.querySelector('.post-user');
        if (userInfo) {
            userInfo.addEventListener('click', () =>
                showUserProfile(post.username, post.name)
            );
        }
    }
    
    // ===== MENTIONS =====  
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
    
    return postElement;
}
// Helper function to convert YouTube URLs to embed format
function convertToEmbedUrl(url) {
    if (!url) return null;
    
    try {
        // Clean up URL - remove any extra parameters that might interfere
        let cleanUrl = url.split('&')[0]; // Take only the first parameter segment
        
        // YouTube Shorts format: https://youtube.com/shorts/VIDEO_ID
        // Also handles: m.youtube.com/shorts/, www.youtube.com/shorts/
        if (cleanUrl.includes('/shorts/')) {
            const videoId = cleanUrl.split('/shorts/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        
        // Extract video ID from various YouTube URL formats
        let videoId = '';
        
        // Mobile format: https://m.youtube.com/watch?si=...&v=VIDEO_ID&feature=...
        if (cleanUrl.includes('m.youtube.com/watch') || cleanUrl.includes('youtube.com/watch')) {
            // Use URL API to parse query parameters
            try {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } catch {
                // Fallback regex for mobile URLs
                const match = url.match(/[?&]v=([^&]+)/);
                videoId = match ? match[1] : '';
            }
        }
        // youtu.be format: https://youtu.be/VIDEO_ID
        else if (cleanUrl.includes('youtu.be/')) {
            videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
        }
        // Feature format: https://www.youtube.com/watch?feature=youtu.be&v=VIDEO_ID
        else if (cleanUrl.includes('youtube.com') && cleanUrl.includes('v=')) {
            const match = cleanUrl.match(/v=([^&]+)/);
            videoId = match ? match[1] : '';
        }
        
        // Clean up video ID (remove any trailing junk)
        if (videoId) {
            videoId = videoId.split('&')[0].split('#')[0].split('?')[0];
            
            // Validate video ID format (should be 11 characters for standard YouTube)
            if (videoId.length >= 11) {
                // Take only the first 11 characters (standard YouTube ID length)
                videoId = videoId.substring(0, 11);
            }
            
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
        
        // If it's already an embed URL, return as-is
        if (cleanUrl.includes('youtube.com/embed/')) {
            return cleanUrl;
        }
        
        return null;
    } catch (error) {
        console.error('Error converting YouTube URL:', error, 'URL:', url);
        return null;
    }
}

// Enhanced isYouTubeUrl function
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

function renderMediaContent(post) {
    if (post.iframe) {
        return `<div class="post-media"><iframe class="post-iframe" src="${post.iframe}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } else if (post.video) {
        return `<div class="post-media">
            <video class="auto-pause-video" src="${post.video}" loop controls controlsList="nodownload noplaybackrate" oncontextmenu="return false;" disablePictureInPicture style="-webkit-touch-callout:none; -webkit-user-select:none; user-select:none;">
                Your browser does not support the video tag.
            </video>
        </div>`;
    } else if (post.image) {
        return `<div class="post-media"><img src="${post.image}" alt="Post image" loading="lazy" oncontextmenu="return false;"></div>`;
    }
    return '';
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
        console.log('Parsing date:', dateString);
        
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        // Handle different date formats
        if (!dateString || typeof dateString !== 'string') {
            console.warn('Invalid date input:', dateString);
            return new Date();
        }
        
        // Parse format: "Dec 13 2025 2:28PM"
        const parts = dateString.split(' ');
        
        if (parts.length < 4) {
            console.warn('Invalid date format, expecting 4 parts:', dateString);
            return new Date();
        }
        
        const monthAbbr = parts[0];
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const timePart = parts[3]; // "2:28PM"
        
        const month = months[monthAbbr];
        if (month === undefined) {
            console.warn('Invalid month:', monthAbbr);
            return new Date();
        }
        
        // Parse time with AM/PM directly attached
        const timeMatch = timePart.match(/(\d+):(\d+)(AM|PM)/i);
        if (!timeMatch) {
            console.warn('Invalid time format, trying alternative:', timePart);
            // Try alternative format with space
            const altParts = dateString.split(' ');
            if (altParts.length >= 5) {
                // Format: "Dec 13 2025 2:28 PM"
                const altTimePart = altParts[3] + altParts[4]; // Combine "2:28" + "PM"
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
        
        // Convert 12-hour to 24-hour format
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
        hours = hours ? hours : 12; // Convert 0 to 12
        
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
        playUnlikeSound();
    } else {
        currentUser.likedPosts.add(postId);
        currentLikes++;
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Liked';
        playLikeSound();
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

function playLikeSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 523.25;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio context not supported, using fallback sound');
        playFallbackSound('like');
    }
}

function playUnlikeSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 392.00;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio context not supported, using fallback sound');
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
        console.log('Playing simulated sound');
    }
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
    
    // Find posts made by the current user
    const userPosts = DATABASEPOSTS.filter(post => 
        post.username === currentUser.username || 
        post.username.toLowerCase() === currentUser.username.toLowerCase()
    );
    
    console.log(`Found ${userPosts.length} posts for user ${currentUser.username}`);
    
    if (userPosts.length === 0) {
        // Show profile even if user has no posts
        showUserProfile(currentUser.username, currentUser.name, true);
        return;
    }
    
    showUserProfile(currentUser.username, currentUser.name, true);
}

function showUserProfile(username, name, isOwnProfile = false) {
    console.log(`Showing profile for ${username} (isOwnProfile: ${isOwnProfile})`);
    
    // Find all posts by this user (case-insensitive match)
    const userPosts = DATABASEPOSTS.filter(post => 
        post.username === username || 
        post.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`Found ${userPosts.length} posts for ${username}`);
    
    if (userPosts.length === 0 && !isOwnProfile) {
        alert('User not found or has no posts');
        return;
    }
    
    // Calculate statistics
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const postsCount = userPosts.length;
    
    // Find mentions of this user
    const userMentions = getMentionsForUser(username);
    
    // Calculate average likes per post
    const averageLikes = postsCount > 0 ? Math.round(totalLikes / postsCount) : 0;
    
    // Find first post date for joined date
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
    
    // Update profile header
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
    
    // Update profile name
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) profileNameElement.textContent = name;
    
    // Create profile content
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
        
        // Populate posts tab
        const postsTab = document.getElementById('postsTab');
        if (userPosts.length > 0) {
            // Sort posts by date (newest first)
            const userPostsSorted = [...userPosts].sort((a, b) => {
                const dateA = parseCustomDate(a.datePost);
                const dateB = parseCustomDate(b.datePost);
                return dateB - dateA; // Newest first
            });
            
            userPostsSorted.forEach((post) => {
                // Find the post in allPosts to get its ID
                const foundPost = allPosts.find(p => 
                    p.username === post.username && 
                    p.datePost === post.datePost &&
                    p.content === post.content
                );
                
                if (foundPost) {
                    const postElement = createPostElement(foundPost, foundPost.id);
                    postsTab.appendChild(postElement);
                } else {
                    // If not found in allPosts, create with a temporary ID
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
        
        // Populate mentions tab
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
        
        // Populate liked posts tab (only for own profile)
        if (isOwnProfile) {
            const likedTab = document.getElementById('likedTab');
            const likedPosts = Array.from(currentUser?.likedPosts || []);
            
            if (likedPosts.length > 0) {
                // Get actual post objects for liked post IDs
                const likedPostObjects = likedPosts
                    .map(postId => allPosts.find(p => p.id === postId))
                    .filter(post => post); // Remove undefined
                
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
        
        // Add tab click event listeners
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }
    
    // Show the profile modal
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
    }
}

// Enhanced getMentionsForUser function
function getMentionsForUser(username) {
    const userMentions = [];
    
    // Use allPosts instead of DATABASEPOSTS to get proper IDs
    allPosts.forEach((post, index) => {
        if (post.content && post.content.toLowerCase().includes(`@${username.toLowerCase()}`)) {
            userMentions.push({
                postId: post.id,
                post: post,
                datePost: parseCustomDate(post.datePost),
                mentionedBy: post.username,
                mentionedByName: post.name,
                topic: post.topic || '',
                content: post.content,
                excerpt: post.content.length > 100 ? 
                    post.content.substring(0, 100) + '...' : 
                    post.content
            });
        }
    });
    
    // Sort by date (newest first)
    userMentions.sort((a, b) => b.datePost - a.datePost);
    return userMentions;
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
    
    // Post creation
    if (elements.createPostBtn) {
        elements.createPostBtn.addEventListener('click', showPostModal);
    }
    
    if (elements.submitPostBtn) {
        elements.submitPostBtn.addEventListener('click', createPost);
    }
    
    if (elements.submitNewPostBtn) {
        elements.submitNewPostBtn.addEventListener('click', createNewPost);
    }
    
    if (elements.createPostMobile) {
        elements.createPostMobile.addEventListener('click', showPostModal);
    }
    
    if (elements.bottomCreatePostBtn) {
        elements.bottomCreatePostBtn.addEventListener('click', showPostModal);
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
    
    // Also update the user menu toggle to close when clicking profile
    if (elements.userMenu && elements.menuToggle) {
        elements.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserMenu();
        });
        
        // Close menu when clicking profile link inside it
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
}

function processPosts(postsArray) {
    console.log('Processing posts data...');

    if (!Array.isArray(postsArray)) {
        console.error('processPosts expected array, got:', postsArray);
        postsArray = [];
    }

    // Validate posts (more lenient for testing)
    const validPosts = postsArray.filter(post => {
        if (!post || typeof post !== 'object') {
            console.log('Skipping invalid post object:', post);
            return false;
        }
        
        // Check required fields
        const hasRequired = post.name && post.username && post.datePost;
        if (!hasRequired) {
            console.log('Skipping post missing required fields:', post);
            return false;
        }
        
        // Try to parse date
        try {
            const parsedDate = parseCustomDate(post.datePost);
            const isValidDate = !isNaN(parsedDate.getTime());
            if (!isValidDate) {
                console.log('Skipping post with invalid date:', post.datePost);
            }
            return isValidDate;
        } catch {
            console.log('Skipping post with date parsing error:', post.datePost);
            return false;
        }
    });

    console.log(`Valid posts: ${validPosts.length}/${postsArray.length}`);

    if (validPosts.length === 0) {
        console.warn('No valid posts found!');
        renderEmptyState();
        return;
    }

    // Store the posts
    DATABASEPOSTS = [...validPosts];

    // Reset UI
    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    currentPage = 0;
    allPosts = [];

    // Debug log first few posts
    console.log('First 3 posts:');
    DATABASEPOSTS.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (@${p.username}) — ${p.datePost} — Likes: ${p.likes}`);
    });

    // Initialize everything
    initializePosts(); // This creates allPosts from DATABASEPOSTS
    loadTrendingTopics();
    loadSuggestedProfiles();
    loadPosts(); // This displays the posts

    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'block';
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.textContent = 'Load More';
    }

    console.log('Posts processing complete.');
}

// ==================== FETCH POSTS (LOCAL JSON) ====================
const JSON_URL = "database_827_383_294_103_759_927_953.json";

// ==================== JSON STRUCTURE EXTRACTOR ====================
function extractPostsFromJSON(data) {
    if (!data) {
        console.error("No data received");
        return [];
    }

    console.log("Data type:", typeof data);
    
    // If data is already the array (which it should be)
    if (Array.isArray(data)) {
        console.log("Successfully extracted array of posts");
        console.log("Number of posts:", data.length);
        return data;
    }
    
    // If data is not an array, log what we got
    console.error("Expected array but got:", typeof data);
    console.error("Data structure:", data);
    
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

    // Add timeout to prevent hanging
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
            
            // Clean the text first
            let cleanedText = text.trim();
            
            // Check if the JSON is complete
            if (!cleanedText.endsWith('}') && !cleanedText.endsWith(']')) {
                console.warn("JSON might be truncated, attempting to fix...");
                // Try to find the last complete object
                const lastBrace = cleanedText.lastIndexOf('}');
                const lastBracket = cleanedText.lastIndexOf(']');
                const cutIndex = Math.max(lastBrace, lastBracket);
                
                if (cutIndex > 0) {
                    cleanedText = cleanedText.substring(0, cutIndex + 1);
                    console.log("Trimmed to:", cleanedText.length, "chars");
                }
            }
            
            // Try to parse
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
                console.error("Problem area (around error):");
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

// ==================== UI HELPERS ====================
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

// ==================== INITIALIZE APP ====================
function initializeApp() {
    console.log("Initializing app...");
    
    // Make sure elements exist
    if (!elements || !elements.postsFeed) {
        console.error("DOM elements not ready yet!");
        setTimeout(initializeApp, 100);
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    setupTheme();
    
    // Then fetch posts
    fetchPosts();
    
    // Then check auth
    checkAuth();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

// Debug function
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
            
            // Check for missing brackets
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

