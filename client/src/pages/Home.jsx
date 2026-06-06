import BeehiveAddBtn from '../components/BeehiveAddBtn'

const Home = ({ session, hives, hivesLoading, onHivesChange }) => {
  return (
      <BeehiveAddBtn
        session={session}
        hives={hives}
        hivesLoading={hivesLoading}
        onHivesChange={onHivesChange}
      />
  )
}

export default Home
