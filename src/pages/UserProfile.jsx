// src/pages/UserProfile.jsx
import React, { useState, useRef } from 'react';
import FloatingActionButton from '../components/FloatingActionButton';
import '../css/UserProfile.css';
import { useSelector } from 'react-redux';

const UserProfile = () => {
  const currentUser = useSelector(state => state.user.currentUser);
  const [userData, setUserData] = useState({
    name: currentUser.username,
    username: "@"+currentUser.username,
    followers: 0,
    following: 0,
    profilePhoto: null,
    posts: [] // Array vazio - sem posts de exemplo
  });

  const fileInputRef = useRef(null);

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData(prev => ({
          ...prev,
          profilePhoto: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = () => {
    window.location.href = '/edit-profile';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const renderPosts = () => {
    if (userData.posts.length === 0) {
      return (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="fas fa-images display-4 mb-3"></i>
            <p className="mb-0">Nenhuma publicação ainda.</p>
          </div>
        </div>
      );
    }

    return userData.posts.map((post, index) => (
      <div className="card mb-3" key={index}>
        <div className="card-body">
          {post.title && <h5 className="post-title">{post.title}</h5>}
          {post.content && <p className="post-content">{post.content}</p>}
          {post.image && (
            <img 
              src={post.image} 
              className="post-image img-fluid rounded mb-2" 
              alt="Post" 
            />
          )}
          {post.audio && (
            <audio controls className="post-audio w-100 mb-2">
              <source src={post.audio} type="audio/mpeg" />
            </audio>
          )}
          <div className="post-date">
            Publicado em: {post.date || new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="profile-container">
              <div className="profile-header position-relative">
                <button className="lapis" onClick={handleEditProfile}>
                  <i className="fa-solid fa-pencil fa-lg" style={{ color: '#ffffff' }}></i>
                </button>
                
                <div 
                  className="profile-picture-container" 
                  onClick={triggerFileInput} 
                  style={{cursor: 'pointer'}}
                >
                  {userData.profilePhoto ? (
                    <img 
                      src={userData.profilePhoto} 
                      alt="Foto de perfil" 
                      className="profile-picture rounded-circle"
                    />
                  ) : (
                    <i className="fas fa-user-circle profile-icon"></i>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="file-input" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
                
                <h1 className="profile-name">{userData.name}</h1>
                <div className="profile-username">{userData.username}</div>
                
                <div className="profile-stats">
                  <div className="stat">
                    <div className="stat-number">{userData.followers}</div>
                    <div className="stat-label">Seguidores</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">{userData.following}</div>
                    <div className="stat-label">Seguindo</div>
                  </div>
                </div>
              </div>
              
              <div className="posts-container">
                {renderPosts()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingActionButton />
    </>
  );
};

export default UserProfile;