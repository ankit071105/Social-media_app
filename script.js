// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCnX63_65JpCsSHeMCz-aWNl_mo6Ikuc3g",
    authDomain: "social-media-app-8dc0e.firebaseapp.com",
    projectId: "social-media-app-8dc0e",
    storageBucket: "social-media-app-8dc0e.appspot.com",
    messagingSenderId: "1030117723329",
    appId: "1:1030117723329:web:c0c06339281f7e56719840",
    measurementId: "G-LJ8KPSPLXY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const signUpForm = document.getElementById('sign-up-form');
const profileForm = document.getElementById('profile-form');
const authContainer = document.getElementById('auth-container');
const profileSetup = document.getElementById('profile-setup');
const home = document.getElementById('home');
const authError = document.getElementById('auth-error');

// Handle sign-up
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        authContainer.style.display = 'none';
        profileSetup.style.display = 'block';
    } catch (error) {
        authError.textContent = error.message;
    }
});

// Handle profile setup
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const birthday = document.getElementById('birthday').value;
    const profilePic = document.getElementById('profile-pic').files[0];

    const user = auth.currentUser;
    if (user) {
        // Upload profile picture
        if (profilePic) {
            const picRef = storage.ref(`profile_pics/${user.uid}`);
            await picRef.put(profilePic);
            const picURL = await picRef.getDownloadURL();

            // Save user profile data to Firestore
            await db.collection('users').doc(user.uid).set({
                username,
                birthday,
                profilePic: picURL
            });
        } else {
            // Save user profile data without profile picture
            await db.collection('users').doc(user.uid).set({
                username,
                birthday
            });
        }

        profileSetup.style.display = 'none';
        home.style.display = 'block';
        loadPosts();
    }
});

// Load posts and videos
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    // Example: Fetch posts from Firestore
    const postsRef = db.collection('posts').doc('somePostId'); // Replace with your posts collection
    const postDoc = await postsRef.get();

    if (postDoc.exists) {
        const postData = postDoc.data();
        postsContainer.innerHTML = `
            <div class="post">
                <div class="post-header">
                    <img src="${postData.profilePic}" alt="Profile Picture" class="profile-pic">
                    <span class="username">${postData.username}</span>
                </div>
                <h3>${postData.title}</h3>
                <p>${postData.content}</p>
                <video controls>
                    <source src="${postData.videoURL}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="post-actions">
                    <button class="like-button">Like</button>
                    <button class="comment-button">Comment</button>
                </div>
                <div class="comments"></div>
            </div>
        `;
    }
}

// Handle video upload
const uploadVideoBtn = document.getElementById('upload-video-btn');
uploadVideoBtn.addEventListener('click', async () => {
    const videoFile = document.getElementById('video-file').files[0];
    if (videoFile) {
        const videoRef = storage.ref(`videos/${videoFile.name}`);
        await videoRef.put(videoFile);
        const videoURL = await videoRef.getDownloadURL();

        // Example: Save video URL to Firestore
        const newPostRef = db.collection('posts').doc('somePostId'); // Replace with your posts collection
        await newPostRef.set({
            title: 'My New Video',
            content: 'Check out my new video!',
            videoURL
        });

        // Reload posts
        loadPosts();
    }
});

// Monitor authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.style.display = 'none';
        profileSetup.style.display = 'block';
    } else {
        authContainer.style.display = 'block';
        profileSetup.style.display = 'none';
        home.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const likeButtons = document.querySelectorAll('.like-button');
    const commentButtons = document.querySelectorAll('.comment-button');

    likeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.textContent = button.textContent === 'Like' ? 'Liked' : 'Like';
        });
    });

    commentButtons.forEach(button => {
        button.addEventListener('click', () => {
            const post = button.closest('.post');
            const comment = prompt('Enter your comment:');
            if (comment) {
                const commentDiv = document.createElement('div');
                commentDiv.classList.add('comment');
                commentDiv.innerHTML = `<span class="comment-username">You</span>: ${comment}`;
                post.querySelector('.comments').appendChild(commentDiv);
            }
        });
    });
});
