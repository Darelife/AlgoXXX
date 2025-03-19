const AddCfButton: React.FC = () => {
  function addcf(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    window.location.href = '/addcf';
  }

  return (
    <div id="metaBox" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button 
        onClick={addcf} 
        style={{ 
          padding: '5.5px 10px', 
          fontSize: '16px', 
          cursor: 'pointer', 
          // backgroundColor: isDarkMode ? '#fff' : '#121212', 
          // color: isDarkMode ? '#000' : '#fff', 
          // border: 'none', 
          borderRadius: '5px',
          transition: 'background-color 0.3s ease'
        }}
        // onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? '#ffcc00' : '#8c8c8c')}
        // onMouseOut={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? '#fff' : '#121212')}
      >
        Add Codeforces
      </button>
    </div>
  );
};

export default AddCfButton;