import BeehiveAddBtn from '../components/BeehiveAddBtn'

const Home = ({ session, hives, hivesLoading, onHivesChange, apiaryControls }) => {
  return (
      <BeehiveAddBtn
        session={session}
        apiaryControls={apiaryControls}
        hives={hives}
        hivesLoading={hivesLoading}
        onHivesChange={onHivesChange}
      />
  )
}

export default Home
