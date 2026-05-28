// VPC CONFIG //
////////////////
resource "aws_vpc" "wuzinit_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name        = "wuzinit"
    Environment = "production"
  }
}

// SUBNET CONFIG //
///////////////////
resource "aws_subnet" "wuzinit_public_subnet" {
  vpc_id     = aws_vpc.wuzinit_vpc.id
  cidr_block = "10.0.192.0/24"    // 256 addresses, 10.0.192.0 - 10.0.192.255

  tags = {
    Name        = "wuzinit DNZ"
    Environment = "production"
  }
}

resource "aws_subnet" "wuzinit_private_subnet_a" {
  vpc_id     = aws_vpc.wuzinit_vpc.id
  cidr_block = "10.0.0.0/18"      // 16384 addresses, 10.0.0.0 - 10.0.63.255

  tags = {
    Name        = "wuzinit private"
    Environment = "production"
  }
}

resource "aws_subnet" "wuzinit_private_subnet_b" {
  vpc_id     = aws_vpc.wuzinit_vpc.id
  cidr_block = "10.0.64.0/18"     // 16384 addresses, 10.0.64.0 - 10.0.127.255

  tags = {
    Name        = "wuzinit private"
    Environment = "production"
  }
}

// SECURITY GROUPS CONFIG //
////////////////////////////
resource "aws_security_group" "wuzinit_lambda_sg" {
  name        = "lambda_sg"
  description = "Allow all inbound/outbound traffic from within the private subnet ranges"
  vpc_id      = aws_vpc.wuzinit_vpc.id

  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    cidr_blocks     = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "wuzinit lambda sg"
    Environment = "production"
  }
}

// EIP CONFIG //
////////////////
resource "aws_eip" "nat_eip" {
  vpc               = true
  # network_interface = aws_network_interface.wuzinit_nat_ein.id

  tags = {
    Name        = "wuzinit NAT EIP"
    Environment = "production"
  }
}

// IGW CONFIG //
////////////////
resource "aws_internet_gateway" "wuzinit_igw" {
  vpc_id = aws_vpc.wuzinit_vpc.id

  tags = {
    Name = "wuzinit igw"
  }
}

// NAT CONFIG //
////////////////
resource "aws_nat_gateway" "wuzinit_nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.wuzinit_public_subnet.id

  tags = {
    Name        = "wuzinit NAT"
    Environment = "production"
  }
}

// ROUTE TABLE CONFIG //
////////////////////////
resource "aws_route_table" "wuzinit_nat_route_table" {
  vpc_id  = aws_vpc.wuzinit_vpc.id

  route {
    cidr_block      = "0.0.0.0/0"
    nat_gateway_id  = aws_nat_gateway.wuzinit_nat.id
  }

  tags = {
    Name        = "wuzinit"
    Environment = "production"
  }
}

resource "aws_route_table" "wuzinit_igw_route_table" {
  vpc_id  = aws_vpc.wuzinit_vpc.id

  route {
    cidr_block  = "0.0.0.0/0"
    gateway_id  = aws_internet_gateway.wuzinit_igw.id
  }

  tags = {
    Name        = "wuzinit"
    Environment = "production"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id       = aws_subnet.wuzinit_public_subnet.id
  route_table_id  = aws_route_table.wuzinit_igw_route_table.id
}

resource "aws_route_table_association" "private_a" {
  subnet_id       = aws_subnet.wuzinit_private_subnet_a.id
  route_table_id  = aws_route_table.wuzinit_nat_route_table.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id       = aws_subnet.wuzinit_private_subnet_b.id
  route_table_id  = aws_route_table.wuzinit_nat_route_table.id
}

