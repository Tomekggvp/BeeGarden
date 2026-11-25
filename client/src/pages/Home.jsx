import BeehiveAddBtn from '../components/BeehiveAddBtn'

const Home = ({ session, hives, hivesLoading, hivesError, onRetryHives, onHivesChange, apiaryControls }) => {
  return (
      <BeehiveAddBtn
        session={session}
        apiaryControls={apiaryControls}
        hives={hives}
        hivesLoading={hivesLoading}
        hivesError={hivesError}
        onRetryHives={onRetryHives}
        onHivesChange={onHivesChange}
      />
  )
}

export default Home
