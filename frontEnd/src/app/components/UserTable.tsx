import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  cfid: string;
  name: string;
  bitsid: string;
  rating: number;
  maxRating: number;
  
}

interface UserTableProps {
  users: User[];
}
//  if (
//                   degreeList[j].innerHTML == "CSE" &&
//                   (degree == "A7" || degree2 == "A7")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "MnC" &&
//                   (degree == "AD" || degree2 == "AD")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "ECE" &&
//                   (degree == "AA" || degree2 == "AA")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "EEE" &&
//                   (degree == "A3" || degree2 == "A3")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "ENI" &&
//                   (degree == "A8" || degree2 == "A8")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "MECH" &&
//                   (degree == "A4" || degree2 == "A4")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "CHEM" &&
//                   (degree == "A1" || degree2 == "A1")
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "Msc. Eco" &&
//                   degree == "B3"
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "Msc. Phy" &&
//                   degree == "B5"
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "Msc. Maths" &&
//                   degree == "B4"
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "Msc. Chem" &&
//                   degree == "B2"
//                 ) {
//                   allow = true;
//                   break;
//                 } else if (
//                   degreeList[j].innerHTML == "Msc. Bio" &&
//                   degree == "B1"
//                 ) {
//                   allow = true;
//                   break;
//                 }
//               }

function getBranch(id?: string) {
  const branch:string[] = [];
  if (id) {
    if (id.includes("A7")) {
      branch.push("CSE");
    } else if (id.includes("AD")) {
      branch.push("MnC");
    } else if (id.includes("AA")) {
      branch.push("ECE");
    } else if (id.includes("A3")) {
      branch.push("EEE");
    } else if (id.includes("A8")) {
      branch.push("ENI");
    } else if (id.includes("A4")) {
      branch.push("MECH");
    } else if (id.includes("A1")) {
      branch.push("CHEM");
    }
  }

  if (id) {
    if (id.includes("B3")) {
      branch.push("Msc. Eco");
    } else if (id.includes("B5")) {
      branch.push("Msc. Phy");
    } else if (id.includes("B4")) {
      branch.push("Msc. Maths");
    } else if (id.includes("B2")) {
      branch.push("Msc. Chem");
    } else if (id.includes("B1")) {
      branch.push("Msc. Bio");
    }
  }

  if (id && id.includes("H")) {
    branch.push("Masters");
  }
  const branches = branch.join(", ");
  return branches;
}

export default function UserTable({ users }: UserTableProps) {
  return (
    <Table>
      <TableCaption>A list of users and their ratings.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='text-left'>Handle</TableHead>
          <TableHead className='text-left'>Name</TableHead>
          <TableHead className='text-left'>BITS ID</TableHead>
          <TableHead className='text-left'>Branch</TableHead>
          <TableHead className='text-right'>Peak Rating</TableHead>
          <TableHead className='text-right'>Current Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.bitsid}>
            <TableCell className='text-left font-medium'>
              {user.cfid}
            </TableCell>
            <TableCell className='text-left'>{user.name}</TableCell>
            <TableCell className='text-left'>{user.bitsid}</TableCell>
            <TableCell className='text-left'>{getBranch(user.bitsid)}</TableCell>
            <TableCell className='text-right'>{user.maxRating}</TableCell>
            <TableCell className='text-right'>{user.rating}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className='text-left'>
            Total Users
          </TableCell>
          <TableCell className='text-right'>{users.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
